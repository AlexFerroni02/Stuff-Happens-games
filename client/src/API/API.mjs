import { Game, Round } from "../models/GAMEModels.mjs"; 
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
//---------------HISTORY MANAGEMENT-----------------//
/*
const getGamesList = async () => {
  const response = await fetch(SERVER_URL + '/api/history/games', {
    credentials: 'include',
  });
  if (response.ok) {
    const gamesJson = await response.json();
    return gamesJson.map(g => new Game(g.id, g.userId, g.status, g.date, g.totalCards, g.totalMistakes, g.currentRound)) ; // oppure puoi fare un mapping se hai una classe Game
  } else {
    throw new Error("Internal server error");
  }
};*/
const getGamesWithDetails = async () => {
  const response = await fetch(SERVER_URL + '/api/history/games', {
    credentials: 'include',
  });
  if (response.ok) {
    const gamesJson = await response.json();
    // Mappa ogni oggetto in un'istanza di Game, includendo rounds_details se serve
    return gamesJson.map(g => {
      const game = new Game(g.id, g.userId, g.status, g.date, g.totalCards, g.totalMistakes, g.currentRound);
      game.rounds_details = g.rounds_details; // aggiungi la proprietà extra se presente
      return game;
    });
  } else {
    throw new Error("Internal server error");
  }
};

//---------------GAME MANAGEMENT-----------------//

//---------------START---------------------------//
const startNewGame = async (userId) => {
  const response = await fetch(`${SERVER_URL}/api/game/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (response.ok) {
    return await response.json(); // // { gameId, initialCards }
  } else {
    throw new Error("Failed to start new game");
  }
};

const getGameState = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/state`, {
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json(); // { initialCards: [...] }
  } else {
    throw new Error("Failed to load game state");
  }
};

//---------------ROUNDS---------------------------//
const guessRound = async (gameId, roundId, position) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/${roundId}/guess`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position }),
  });
  if (response.ok) {
    return await response.json(); // nuovo stato partita
  } else {
    throw new Error("Failed to submit guess");
  }
};

const timeoutRound = async (gameId, roundId) => {
  const response = await fetch(`${SERVER_URL}/api/game/${gameId}/round/${roundId}/timeout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    // No body needed, or an empty one
  });
  if (response.ok) {
    return await response.json(); // new game state
  } else {
    throw new Error("Failed to process timeout");
  }
};


const API = { logIn, getUserInfo, logOut ,getGamesWithDetails, startNewGame, getGameState,guessRound,timeoutRound};
export default API;