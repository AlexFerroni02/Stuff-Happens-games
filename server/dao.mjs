import sqlite from 'sqlite3';
import crypto from 'crypto';
import { Game, Round } from './GAMEModels.mjs';
import dayjs from 'dayjs';

// Open a database connection
const db = new sqlite.Database('game.sqlite', (err) => {
    if (err) throw err;
});


// USERS
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: row.id, username: row.username};
        
        crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};


//------------------- GAMES --------------------------//


export const listGames = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM games WHERE userId = ? ORDER BY date DESC, id DESC';
    db.all(sql, [userId], (err, rows) => {
      if (err)
        reject(err);
      else {
        const games = rows.map((g) => new Game(g.id, g.userId, g.status, g.date, g.totalCards, g.totalMistakes, g.currentRound));
        resolve(games);
      }
    });
  });
};

export const createNewGame = (userId) => {
  return new Promise((resolve, reject) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const sql = `INSERT INTO games (userId, status, date, totalCards, totalMistakes, currentRound)
                 VALUES (?, 'in_progress', ?, 3, 0, 0)`;
    db.run(sql, [userId, now], function(err) {
      if (err) return reject(err);
      resolve(this.lastID); // id della partita appena creata
    });
  });
};

export const updateGameEndStatus = (gameId, status, totalCards, totalMistakes, playedRoundsCount) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE games SET status = ?, totalCards = ?, totalMistakes = ?, currentRound = ? WHERE id = ?`;
    db.run(sql, [status, totalCards, totalMistakes, playedRoundsCount, gameId], function(err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

//-------------------- ROUNDS --------------------------//

export const listRoundsOfGame = (gameId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM rounds WHERE gameID = ? ORDER BY id ASC';
    db.all(sql, [gameId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const rounds = rows.map(r => new Round(r.id, r.gameID, r.cardId, r.roundNumber, r.status));
        resolve(rounds);
      }
    });
  });
};

export const saveInitialRounds = (gameId, cardIds) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO rounds (gameID, roundNumber, cardId, status) VALUES (?, NULL, ?, "initial")');
    for (const cardId of cardIds) {
      stmt.run([gameId, cardId]);
    }
    stmt.finalize((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};


// Crea un nuovo round "in_progress"
export const createNewRound = (gameId, cardId) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO rounds (gameID, roundNumber, cardId, status) VALUES (?, NULL, ?, 'in_progress')`;
    db.run(sql, [gameId, cardId], function (err) {
      if (err) return reject(err);
      resolve(this.lastID); // id del nuovo round
    });
  });
};

// Funzione di utilità per aggiornare lo stato di un round
export const updateRoundStatus = (roundId, status, roundNumber) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE rounds SET status = ?, roundNumber = ? WHERE id = ?`;
    db.run(sql, [status, roundNumber, roundId], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

//-------------------- CARDS--------------------------//

export const getCardById = (cardId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM cards WHERE id = ?';
    db.get(sql, [cardId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const card = {
          id: row.id,
          name: row.name,
          image: row.image,
          index: row.index
        };
        resolve(card); 
      }
    });
  });
};


export const getRandomInitialCards = (userId) => {
  return new Promise((resolve, reject) => {
    // Prendi 3 carte random dal DB
    db.all('SELECT * FROM cards ORDER BY RANDOM() LIMIT 3', [], (err, rows) => {
      if (err) return reject(err);
      rows.sort((a, b) => a.index - b.index);
      resolve(rows);
    });
  });
};

// Estrai una carta random che NON sia tra quelle passate
export const getRandomCardExcluding = (excludedIds) => {
  return new Promise((resolve, reject) => {
    const placeholders = excludedIds.map(() => '?').join(',');
    const sql = `SELECT * FROM cards WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`;
    db.get(sql, excludedIds, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};


