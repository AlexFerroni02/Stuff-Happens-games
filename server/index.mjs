// imports
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import { Game, Round } from './GAMEModels.mjs';
import { getUser, listGames, listRoundsOfGame, getCardById,createNewGame, saveInitialRounds,getRandomInitialCards,getRandomCardExcluding, createNewRound,updateRoundStatus, updateGameEndStatus } from './dao.mjs'; // Assuming you have a function to get user from your database
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

//----------------GAME MANAGEMENT-----------------//
/*
app.post('/api/game/start', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    // crea una nuova partita nel DB e restituisci le 3 carte random
    const cards = await getRandomInitialCards(userId);
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start new game' });
  }
});*/

app.post('/api/game/start', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;
    // 1. Crea la partita nel DB e ottieni gameId
    const gameId = await createNewGame(userId); 
    // 2. Estrai 3 carte random e salvale come round "initial"
    const cards = await getRandomInitialCards(userId);
    await saveInitialRounds(gameId, cards.map(c => c.id)); // funzione da implementare
    // 3. Restituisci gameId e carte iniziali
    res.json({ gameId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start new game' });
  }
});

app.get('/api/game/:gameId/state', isLoggedIn, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    // Recupera tutti i round della partita
    const rounds = await listRoundsOfGame(gameId);

    // Carte già usate (possessate o già giocate)
    const usedCardIds = rounds.map(r => r.cardId);

    // Carte possedute (initial + won)
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

    // Trova la carta del round corrente (status 'in_progress')
    let currentRound = rounds.find(r => r.status === 'in_progress');
    let currentCard = null;
    let roundId = null;

    // Se non c'è un round in corso e la partita non è finita, estrai una nuova carta random NON usata
    if (!currentRound && ownedCards.length < 6 && mistakes < 3) {
      const newCard = await getRandomCardExcluding(usedCardIds);
      if (newCard) {
        roundId = await createNewRound(gameId, newCard.id);
        currentCard = newCard;
      }
    } else if (currentRound) {
      currentCard = await getCardById(currentRound.cardId);
      roundId = currentRound.id;
    }

    // Stato partita
    let status = "in_progress";
    if (ownedCards.length >= 6) status = "win";
    if (mistakes >= 3) status = "lose";

    // Risposta: restituisci solo le proprietà che servono al frontend
    res.json({
      ownedCards,
      currentRound: currentCard ? { roundId, card: { id: currentCard.id, name: currentCard.name, image: currentCard.image } } : null,
      mistakes,
      status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load game state' });
  }
});
//---------------ROUND-------------------//

app.post('/api/game/:gameId/round/:roundId/guess', isLoggedIn, [
  body('position').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const { gameId, roundId } = req.params;
  const { position } = req.body;

  try { // Added try-catch block for the whole endpoint logic
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

    // Recupera la carta del round corrente
    const currentRoundInfo = rounds.find(r => r.id == roundId && r.status === 'in_progress');
    if (!currentRoundInfo) return res.status(400).json({ error: 'Invalid round or round already processed' });
    const cardToGuess = await getCardById(currentRoundInfo.cardId);

    // Trova la posizione corretta
    let correctPos = ownedCards.findIndex(c => c.index > cardToGuess.index);
    if (correctPos === -1) correctPos = ownedCards.length;

    // Aggiorna il round come 'won' o 'lost'
    let lastGuessCorrect = false;
    const roundNumberOfThisRound = rounds.filter(r => r.roundNumber !== null).length + 1;

    if (position == correctPos) {
      await updateRoundStatus(roundId, 'won', roundNumberOfThisRound);
      lastGuessCorrect = true;
    } else {
      await updateRoundStatus(roundId, 'lost', roundNumberOfThisRound);
    }

    // Restituisci il nuovo stato partita
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
      currentRound: null, 
      mistakes: mistakesAfter,
      status: statusAfter,
      lastGuessCorrect
    });
  } catch (err) {
    console.error("Error in guessRound:", err);
    res.status(500).json({ error: 'Failed to process guess' });
  }
});

app.post('/api/game/:gameId/round/:roundId/timeout', isLoggedIn, async (req, res) => {
  const { gameId, roundId } = req.params;

  try {
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
      const currentMistakes = rounds.filter(r => r.status === 'lost').length;
      let currentStatus = "in_progress";
      if (ownedCards.length >= 6) currentStatus = "win";
      if (currentMistakes >= 3) currentStatus = "lose";
      return res.json({
        ownedCards,
        currentRound: null,
        mistakes: currentMistakes,
        status: currentStatus,
        lastGuessCorrect: false
      });
    }
    
    const roundNumberOfThisRound = rounds.filter(r => r.roundNumber !== null).length + 1;
    await updateRoundStatus(roundId, 'lost', roundNumberOfThisRound);

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
      currentRound: null, 
      mistakes: mistakesAfter,
      status: statusAfter,
      lastGuessCorrect: false
    });

  } catch (err) {
    console.error("Error processing timeout for round:", roundId, "game:", gameId, err);
    res.status(500).json({ error: 'Failed to process timeout' });
  }
});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});