import { Game} from "../models/GAMEModels.mjs"; 
const SERVER_URL = "http://localhost:3001";




// -------------- USER AUTHENTICATION --------------//

const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    return user;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include',
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user;  // an object with the error coming from the server
  }
};

const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
}
//---------------DEMO MANAGEMENT-----------------//
const startDemo = async () => {
  const response = await fetch(SERVER_URL + '/api/demo/start', { method: 'POST' });
  if (response.ok) {
    return await response.json(); // { gameId, roundId, initialCards, cardToGuess }
  } else {
    const err = await response.json();
    throw new Error(err.error || "Failed to start demo game");
  }
};


const guessDemoRound = async (gameId, roundId, position) => {
  const response = await fetch(`${SERVER_URL}/api/demo/game/${gameId}/round/${roundId}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const err = await response.json();
    throw new Error(err.error || "Failed to submit demo guess");
  }
};

const timeoutDemoRound = async (gameId, roundId) => {
  const response = await fetch(`${SERVER_URL}/api/demo/game/${gameId}/round/${roundId}/timeout`, {
    method: 'POST',
  });
  if (response.ok) {
    return await response.json(); // { correct, timeout, message }
  } else {
    const err = await response.json();
    throw new Error(err.error || "Failed to process demo timeout");
  }
};

const deleteDemoGame = async (gameId) => {
  if (!gameId) return; 
  try {
    const response = await fetch(SERVER_URL + `/api/demo/game/${gameId}`, { method: 'DELETE' });
    if (response.ok) {
      
      return await response.json();
    } else {
      const err = await response.json();
      throw new Error(err.error || "Failed to delete demo game");
    }
  } catch (error) {
    console.error("Error in deleteDemoGame API call:", error);
    
  }
};




//---------------HISTORY MANAGEMENT-----------------//
// GET GAMES WITH DETAILS
const getGamesWithDetails = async () => {
  const response = await fetch(SERVER_URL + '/api/history/games', {
    credentials: 'include',
  });
  if (response.ok) {
    const gamesJson = await response.json();
    // Mappa ogni oggetto in un'istanza di Game, includendo rounds_details se serve
    return gamesJson.map(g => {
      const game = new Game(g.id, g.userId, g.status, g.date, g.totalCards, g.totalMistakes);
      game.rounds_details = g.rounds_details; 
      return game;
    });
  } else {
    throw new Error("Internal server error");
  }
};

//---------------GAME MANAGEMENT-----------------//
// GET INITIAL CARDS
const getInitialCards = async (gameId) => {
  
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/initial-cards`, {
    credentials: 'include',
  });
  
  if (response.ok) {
    return await response.json(); // { initialCards: [...] }
  } else {
    throw new Error("Failed to load initial cards");
  }
};

//---------------START---------------------------//
//POST NEW GAME 
const startNewGame = async () => {
  const response = await fetch(`${SERVER_URL}/api/game/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    
  });
  if (response.ok) {
    return await response.json(); 
  } else {
    throw new Error("Failed to start new game");
  }
};


//---------------ROUNDS---------------------------//

// POST NEW ROUND e si crea la carta
const startNewRound = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/new`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (response.ok) {
    return await response.json(); // { roundId }
  } else {
    throw new Error("Failed to start new round");
  }
};
// GET ROUND STATE
const getRoundState = async (gameId, roundId) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/${roundId}/state`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to load round state");
  }
};

// POST GUESS
const guessRound = async (gameId, roundId, position) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/${roundId}/guess`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position }),
  });
  if (response.ok) {
    return await response.json(); 
  } else {
    throw new Error("Failed to submit guess");
  }
};

const timeoutRound = async (gameId, roundId) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/${roundId}/timeout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
   
  });
  if (response.ok) {
    return await response.json(); // new game state
  } else {
    throw new Error("Failed to process timeout");
  }
};


const API = { logIn, getUserInfo, logOut ,getGamesWithDetails, getInitialCards,startNewGame,guessRound,timeoutRound,startNewRound, getRoundState,
  startDemo, guessDemoRound, timeoutDemoRound, deleteDemoGame
 };
export default API;