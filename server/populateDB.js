const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./game.sqlite'); // Assicurati che il path sia corretto

// ID dell'utente per cui simulare le partite
const userIdForGames = 1;

db.serialize(() => {
    console.log(`Inizio popolamento cronologia per utente ID: ${userIdForGames} (con 6 carte totali)`);

    // --- Simula Partita 1 (VINTA) ---
    // L'utente deve collezionare tutte e 6 le carte.
    // 3 iniziali + 3 vinte nei round successivi.
    // total_collected_cards = 6
    // totalMistakes = 0 (per semplicità, partita perfetta)
    // current_round_number = 3 (3 round giocati dopo gli iniziali per vincere le 3 carte mancanti)
    const game1Date = '2025-05-20 10:00:00';
    db.run(`INSERT INTO games (userId, status, date, totalCards, totalMistakes, currentRound)
            VALUES (?, 'win', ?, 6, 0, 3)`,
        [userIdForGames, game1Date], function(err) {
        if (err) return console.error("Errore inserimento game 1 (WIN):", err.message);
        const game1Id = this.lastID;
        console.log(`Partita 1 (VINTA) creata con ID: ${game1Id}`);

        // Round per Game 1 (VINTA)
        // Carte iniziali: ID 1, 2, 3
        db.run(`INSERT INTO rounds (gameID, roundNumber,cardId, status) VALUES (?, NULL, 1,  'initial')`, [game1Id]);
        db.run(`INSERT INTO rounds (gameID,roundNumber, cardId,  status) VALUES (?, NULL,2,  'initial')`, [game1Id]);
        db.run(`INSERT INTO rounds (gameID, roundNumber,cardId,  status) VALUES (?, NULL, 3,  'initial')`, [game1Id]);
        // Round giocati e vinti per ottenere le altre 3 carte (ID 4, 5, 6)
        db.run(`INSERT INTO rounds (gameID, roundNumber,cardId,  status) VALUES (?, 1,4,  'won')`, [game1Id]); // Round 1 vince carta 4
        db.run(`INSERT INTO rounds (gameID, roundNumber,cardId,  status) VALUES (?, 2, 5 , 'won')`, [game1Id]); // Round 2 vince carta 5
        db.run(`INSERT INTO rounds (gameID, roundNumber,cardId,  status) VALUES (?, 3, 6,  'won')`, [game1Id]); // Round 3 vince carta 6
    });

    // --- Simula Partita 2 (PERSA) ---
    // L'utente fa 3 errori.
    // total_collected_cards = 3 (le 3 iniziali, nessun round vinto)
    // totalMistakes = 3
    // current_round_number = 3 (3 round giocati e persi)
    const game2Date = '2025-05-21 14:30:00';
    db.run(`INSERT INTO games (userId, status, date, totalCards, totalMistakes, currentRound)
            VALUES (?, 'lose', ?, 3, 3, 3)`,
        [userIdForGames, game2Date], function(err) {
        if (err) return console.error("Errore inserimento game 2 (LOSE):", err.message);
        const game2Id = this.lastID;
        console.log(`Partita 2 (PERSA) creata con ID: ${game2Id}`);

        // Round per Game 2 (PERSA)
        // Carte iniziali: ID 1, 2, 3 (possono essere le stesse per semplicità di script)
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, NULL, 1,  'initial')`, [game2Id]);
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, NULL, 2,  'initial')`, [game2Id]);
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, NULL, 3,  'initial')`, [game2Id]);
        // Round giocati e persi (usando le carte rimanenti ID 4, 5, 6)
        // La specifica dice che una carta persa non viene ripresentata *nella stessa partita*.
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, 1, 4,  'lost')`, [game2Id]); // Round 1 perde carta 4 (Errore 1)
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, 2, 5,  'lost')`, [game2Id]);   // Round 2 perde carta 5 (Errore 2)
        db.run(`INSERT INTO rounds (gameID, roundNumber, cardId,  status) VALUES (?, 3, 6,  'lost')`, [game2Id]); // Round 3 perde carta 6 (Errore 3 -> Partita persa)
    });

    // Comando fittizio per agganciare la chiusura del DB in modo più sicuro con db.serialize
    db.run("SELECT 1", [], function(err) {
        if (err) console.error("Errore comando fittizio:", err.message);
        console.log("Script di popolamento cronologia (6 carte) completato.");
        db.close((err) => {
            if (err) return console.error("Errore chiusura DB:", err.message);
            console.log('Connessione al database chiusa.');
        });
    });
});