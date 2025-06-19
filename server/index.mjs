// imports
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dayjs from 'dayjs';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import { Game } from './GAMEModels.mjs';
import { getUser, listGames, listRoundsOfGame, getCardById,createNewGame, saveInitialRounds,getRandomInitialCards,getRandomCardExcluding, createNewRound,updateRoundStatus, updateGameEndStatus,deleteGameAndRounds } from './dao.mjs'; // Assuming you have a function to get user from your database
// init express
const app = express();
const port = 3001;
//---------------MIDDLEWARES-----------------//
app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};
app.use(cors(corsOptions));
// for using static files (images)
app.use('/images', express.static('images'));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  // taking the user from the database
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, {id:user.id, username:user.username});
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

//-----------------SESSION MANAGEMENT & USER AUTHENTICATION-----------------//

// POST /api/sessions
app.post('/api/sessions', passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

//----------------HISTORY-----------------//
// GET /api/games - Get all games for the logged-in user
app.get('/api/history/games', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;
    const games = await listGames(userId);
    
    for (const game of games) {
      const rounds = await listRoundsOfGame(game.id);
      for (const round of rounds) {
        const card = await getCardById(round.cardId);
        if (card) round.cardName = card.name;
      }
      game.rounds_details = rounds.map(r => ({
        cardName: r.cardName,
        status: r.status,
        roundNumber: r.roundNumber
      }));
    }

    res.json(games);
  } catch (error) {
    console.error("Error fetching games details:", error);
    res.status(500).json({ error: 'Failed to retrieve games details.' });
  }
});
//----------------DEMO MANAGEMENT-----------------//
const DEMO_USER_ID = 0; // User ID speciale per le partite demo


app.post('/api/demo/start', async (req, res) => {
  try {
    const gameId = await createNewGame(DEMO_USER_ID); 
    const initialCardsData = await getRandomInitialCards(); 
    await saveInitialRounds(gameId, initialCardsData.map(c => c.id));
    
    // Subito dopo, crea il primo (e unico) round per la demo
    const rounds = await listRoundsOfGame(gameId);
    const usedCardIds = rounds.map(r => r.cardId);
    const newCard = await getRandomCardExcluding(usedCardIds);

    if (!newCard) {
      await deleteGameAndRounds(gameId); 
      return res.status(500).json({ error: "No cards available to start demo round." });
    }
    
    const { roundId, startedAt } = await createNewRound(gameId, newCard.id);
    
    res.json({ 
      gameId, 
      roundId, 
      initialCards: initialCardsData.sort((a,b) => a.index - b.index), 
      cardToGuess: {
        id: newCard.id,
        name: newCard.name,
        image: newCard.image
        
      }
    });
  } catch (err) {
    console.error("Error starting demo game:", err);
    res.status(500).json({ error: 'Failed to start demo game' });
  }
});

app.post('/api/demo/game/:gameId/round/:roundId/guess', [
  body('position').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { gameId, roundId } = req.params;
  const { position } = req.body;

  try {
    const rounds = await listRoundsOfGame(gameId); 
    const currentRoundInfo = rounds.find(r => r.id == roundId && r.status === 'in_progress');

    if (!currentRoundInfo) {
      return res.status(400).json({ error: "Demo round not found or already completed." });
    }

    const cardToGuess = await getCardById(currentRoundInfo.cardId);
    const initialCardsRaw = rounds.filter(r => r.status === 'initial');
    const initialCards = [];
    for (const r of initialCardsRaw) {
        const card = await getCardById(r.cardId);
        if (card) initialCards.push(card);
    }
    initialCards.sort((a, b) => a.index - b.index);

    let guessResult = {
      correct: false,
      timeout: false,
      message: ""
    };

    const now = dayjs();
    const startedAt = dayjs(currentRoundInfo.startedAt); 

    if (now.diff(startedAt, 'second') > 30) {
      await updateRoundStatus(roundId, 'lost_timeout_demo', null); 
      guessResult.timeout = true;
      guessResult.message = "Time's up! You lost this demo round.";
    } else {
      let correctPos = initialCards.findIndex(c => c.index > cardToGuess.index);
      if (correctPos === -1) correctPos = initialCards.length;

      if (position == correctPos) {
        await updateRoundStatus(roundId, 'won_demo', null); 
        guessResult.correct = true;
        guessResult.message = "Correct! You would win this card.";
        guessResult.cardToGuess = {
          id: cardToGuess.id,
          name: cardToGuess.name,
          image: cardToGuess.image,
          index: cardToGuess.index
        };
      } else {
        await updateRoundStatus(roundId, 'lost_demo', null);
        guessResult.message = "Wrong! You would lose this demo round.";
      }
    }
    
    res.json(guessResult);

  } catch (err) {
    console.error("Error processing demo guess:", err);
    res.status(500).json({ error: 'Failed to process demo guess' });
  }
});
app.post('/api/demo/game/:gameId/round/:roundId/timeout', async (req, res) => {
  const { gameId, roundId } = req.params;
  try {
    const rounds = await listRoundsOfGame(gameId);
    const currentRoundInfo = rounds.find(r => r.id == roundId && r.status === 'in_progress');

    if (currentRoundInfo) {
      await updateRoundStatus(roundId, 'lost_timeout_demo', null);
    }
    
    res.json({
      correct: false,
      timeout: true,
      message: "Time's up! You lost this demo round."
    });
  } catch (err) {
    console.error("Error processing demo timeout:", err);
    res.status(500).json({ error: 'Failed to process demo timeout' });
  }
});

app.delete('/api/demo/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    await deleteGameAndRounds(gameId); 
    res.status(200).json({ message: "Demo game deleted successfully." });
  } catch (err) {
    console.error("Error deleting demo game:", err);
    res.status(500).json({ error: 'Failed to delete demo game' });
  }
});

//----------------GAME MANAGEMENT-----------------//


app.post('/api/game/start', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const gameId = await createNewGame(userId); 
    // genero le carte e poi le salvo nel DB
    const cards = await getRandomInitialCards();
    await saveInitialRounds(gameId, cards.map(c => c.id));
    
    res.json({ gameId});
  } catch (err) {
    res.status(500).json({ error: 'Failed to start new game' });
  }
});

app.get('/api/game/:gameId/initial-cards', isLoggedIn, async (req, res) => {
  try {
    const { gameId } = req.params;
    const rounds = await listRoundsOfGame(gameId);
    const initialCards = [];
    for (const round of rounds) {
      if (round.status === 'initial') {
        const card = await getCardById(round.cardId);
        if (card) initialCards.push(card);
      }
    }
    initialCards.sort((a, b) => a.index - b.index);
    res.json({ initialCards });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load initial cards' });
  }
});





//---------------ROUND-------------------//
app.post('/api/game/:gameId/round/new', isLoggedIn, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    
    const rounds = await listRoundsOfGame(gameId);
    
    const usedCardIds = rounds.map(r => r.cardId);

    // prendi una carta che non sta tra quelle usate
    const newCard = await getRandomCardExcluding(usedCardIds);
    if (!newCard) {
      
      return res.status(400).json({ error: "No more cards available for this game or cards table is empty." });
    }
    
    const { roundId } = await createNewRound(gameId, newCard.id);

    res.json({ roundId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create new round" });
  }
});

app.post('/api/game/:gameId/round/:roundId/guess', isLoggedIn, [
  body('position').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const { gameId, roundId } = req.params;
  const { position } = req.body;

  try { 
    // Recupera i round e le carte in mano ordinate
    const rounds = await listRoundsOfGame(gameId);
    const ownedCards = [];
    for (const round of rounds) {
      if (round.status === 'initial' || round.status === 'won') {
        const card = await getCardById(round.cardId);
        if (card) ownedCards.push(card);
      }
    }
    ownedCards.sort((a, b) => a.index - b.index);

    const currentRoundInfo = rounds.find(r => r.id == roundId && r.status === 'in_progress');
    if (!currentRoundInfo) {
      return res.status(400).json({ error: "Round not found or already completed" });
    }
    const cardToGuess = await getCardById(currentRoundInfo.cardId);

    let lastGuessCorrect = false;
    let isTimeout = false;

    // --- Controllo timeout ---
    const now = dayjs();
    const startedAt = dayjs(currentRoundInfo.startedAt);
    const roundNumberOfThisRound = rounds.filter(r => r.roundNumber !== null).length + 1;
    if (now.diff(startedAt, 'second') > 30) {
      
      await updateRoundStatus(roundId, 'lost', roundNumberOfThisRound);
      isTimeout = true;
    } else {
     
      let correctPos = ownedCards.findIndex(c => c.index > cardToGuess.index);
      if (correctPos === -1) correctPos = ownedCards.length;

      if (position == correctPos) {
        await updateRoundStatus(roundId, 'won', roundNumberOfThisRound);
        lastGuessCorrect = true;
      } else {
        await updateRoundStatus(roundId, 'lost', roundNumberOfThisRound);
      }
    }

    const roundsAfter = await listRoundsOfGame(gameId);
    const ownedCardsAfter = [];
    for (const round of roundsAfter) {
      if (round.status === 'initial' || round.status === 'won') {
        const card = await getCardById(round.cardId);
        if (card) ownedCardsAfter.push(card);
      }
    }
    ownedCardsAfter.sort((a, b) => a.index - b.index);
    const mistakesAfter = roundsAfter.filter(r => r.status === 'lost').length;
    let statusAfter = "in_progress";
    if (ownedCardsAfter.length >= 6) statusAfter = "win";
    if (mistakesAfter >= 3) statusAfter = "lose";

    if (statusAfter === 'win' || statusAfter === 'lose') {
      const playedRoundsCount = roundsAfter.filter(r => r.roundNumber !== null).length;
      await updateGameEndStatus(gameId, statusAfter, ownedCardsAfter.length, mistakesAfter, playedRoundsCount);
    }

    res.json({
      ownedCards: ownedCardsAfter,
      mistakes: mistakesAfter,
      status: statusAfter,
      lastGuessCorrect,
      timeout: isTimeout
    });
  } catch (err) {
    console.error("Error in guessRound:", err);
    res.status(500).json({ error: 'Failed to process guess' });
  }
});

app.get('/api/game/:gameId/round/:roundId/state', isLoggedIn, async (req, res) => {
  try {
    const { gameId, roundId } = req.params;
    const rounds = await listRoundsOfGame(gameId);

    
    const ownedCards = [];
    let mistakes = 0;
    for (const round of rounds) {
      if (round.status === 'initial' || round.status === 'won') {
        const card = await getCardById(round.cardId);
        if (card) ownedCards.push(card);
      }
      if (round.status === 'lost') mistakes++;
    }
    ownedCards.sort((a, b) => a.index - b.index);

    
    const currentRound = rounds.find(r => r.id == roundId);
    let currentCard = null;
    let startedAt = null;
    if (currentRound) {
      currentCard = await getCardById(currentRound.cardId);
      startedAt = currentRound.startedAt;
    }
    let status = "in_progress";
    if (ownedCards.length >= 6) status = "win";
    if (mistakes >= 3) status = "lose";

    res.json({
      ownedCards,
      currentRound: currentCard ? { card: { id: currentCard.id, name: currentCard.name, image: currentCard.image } } : null,
      mistakes,
      status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load round state' });
  }
});


app.post('/api/game/:gameId/round/:roundId/timeout', isLoggedIn, async (req, res) => {
  const { gameId, roundId } = req.params;

  try {
    const rounds = await listRoundsOfGame(gameId);

    
    const currentRoundInfo = rounds.find(r => r.id == roundId && r.status === 'in_progress');
    if (currentRoundInfo) {
      const roundNumberOfThisRound = rounds.filter(r => r.roundNumber !== null).length + 1;
      await updateRoundStatus(roundId, 'lost', roundNumberOfThisRound);
    }

    // Raccogli i dati aggiornati UNA SOLA VOLTA
    const roundsAfter = await listRoundsOfGame(gameId);
    const ownedCards = [];
    for (const round of roundsAfter) {
      if (round.status === 'initial' || round.status === 'won') {
        const card = await getCardById(round.cardId);
        if (card) ownedCards.push(card);
      }
    }
    ownedCards.sort((a, b) => a.index - b.index);
    const mistakes = roundsAfter.filter(r => r.status === 'lost').length;
    let status = "in_progress";
    if (mistakes >= 3) status = "lose";

    if (status === 'lose') {
      const playedRoundsCount = roundsAfter.filter(r => r.roundNumber !== null).length;
      await updateGameEndStatus(gameId, status, ownedCards.length, mistakes, playedRoundsCount);
    }

    res.json({
      ownedCards,
      mistakes,
      status,
      lastGuessCorrect: false,
      timeout: true
    });

  } catch (err) {
    console.error("Error processing timeout for round:", roundId, "game:", gameId, err);
    res.status(500).json({ error: 'Failed to process timeout' });
  }
});



app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});