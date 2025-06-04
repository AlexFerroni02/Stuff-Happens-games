const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./game.sqlite'); // Assicurati che il path sia corretto

// ID dell'utente per cui simulare le partite
const userIdForGames = 1;

db.serialize(() => {
    console.log(`Inizio popolamento cronologia per utente ID: ${userIdForGames} (con 6 carte totali)`);
    const cards = [
  { id: 1, name: "Ti rubano il passaporto", idx: 89, image: "/images/card1.jpeg" },
  { id: 2, name: "Perdi l'aereo per 2 minuti", idx: 78, image: "/images/card2.jpeg" },
  { id: 3, name: "Ti si rompe il trolley appena atterrato", idx: 55, image: "/images/card3.jpeg" },
  { id: 4, name: "Ti perdi in un mercato locale senza internet", idx: 62, image: "/images/card4.jpeg" },
  { id: 5, name: "Sbagli treno e finisci in un'altra città", idx: 68, image: "/images/card5.jpeg" },
  { id: 6, name: "Ti pizzica una medusa", idx: 70, image: "/images/card6.jpeg" },
  { id: 7, name: "Dormitorio con cimici da letto", idx: 80, image: "/images/card7.jpeg" },
  { id: 8, name: "Taxi ti porta all'aeroporto sbagliato", idx: 73, image: "/images/card8.jpeg" },
  { id: 9, name: "Ti rubano il portafoglio", idx: 88, image: "/images/card9.jpeg" },
  { id: 10, name: "Febbre tropicale durante safari", idx: 91, image: "/images/card10.jpeg" },
  { id: 11, name: "Perdi l'escursione perché ti svegli tardi", idx: 56, image: "/images/card11.jpeg" },
  { id: 12, name: "Bloccato in aeroporto per 24h", idx: 76, image: "/images/card12.jpeg" },
  { id: 13, name: "Ti ustioni il naso il primo giorno", idx: 40, image: "/images/card13.jpeg" },
  { id: 14, name: "Ti mordono zanzare ovunque", idx: 38, image: "/images/card14.jpeg" },
  { id: 15, name: "Ti scambiano zaino in ostello", idx: 60, image: "/images/card15.jpeg" },
  { id: 16, name: "Non trovi nulla di commestibile per giorni", idx: 63, image: "/images/card16.jpeg" },
  { id: 17, name: "Il volo è in overbooking e resti fuori", idx: 82, image: "/images/card17.jpeg" },
  { id: 18, name: "Perdi la valigia all’andata", idx: 85, image: "/images/card18.jpeg" },
  { id: 19, name: "Ti scoppia la gomma dell’auto nel nulla", idx: 67, image: "/images/card19.jpeg" },
  { id: 20, name: "Ti dimentichi il caricabatterie", idx: 30, image: "/images/card20.jpeg" },
  { id: 21, name: "Scopri di avere allergia alla cucina locale", idx: 71, image: "/images/card21.jpeg" },
  { id: 22, name: "Punti la carta sim e non funziona", idx: 58, image: "/images/card22.jpeg" },
  { id: 23, name: "Una scimmia ti ruba il cibo", idx: 46, image: "/images/card23.jpeg" },
  { id: 24, name: "Ti svegli pieno di bolle strane", idx: 61, image: "/images/card24.jpeg" },
  { id: 25, name: "Ti investe uno scooter a Bali", idx: 79, image: "/images/card25.jpeg" },
  { id: 26, name: "Ti perdi durante un trekking in montagna", idx: 75, image: "/images/card26.jpeg" },
  { id: 27, name: "Ti si scaricano le cuffie in volo", idx: 15, image: "/images/card27.jpeg" },
  { id: 28, name: "Scopri che l'hotel non esiste", idx: 86, image: "/images/card28.jpeg" },
  { id: 29, name: "Ti cacciano da un tempio per abbigliamento", idx: 52, image: "/images/card29.jpeg" },
  { id: 30, name: "Nessuno parla inglese e ti disperi", idx: 66, image: "/images/card30.jpeg" },
  { id: 31, name: "Ti trovi nel mezzo di una protesta", idx: 74, image: "/images/card31.jpeg" },
  { id: 32, name: "Vedi l’aurora boreale... ma dimentichi la fotocamera", idx: 33, image: "/images/card32.jpeg" },
  { id: 33, name: "Ti si rovescia lo zaino in mare", idx: 69, image: "/images/card33.jpeg" },
  { id: 34, name: "Ti perdi una coincidenza per ritardo", idx: 72, image: "/images/card34.jpeg" },
  { id: 35, name: "Prenoti per il giorno sbagliato", idx: 59, image: "/images/card35.jpeg" },
  { id: 36, name: "Ti chiudono dentro al museo", idx: 43, image: "/images/card36.jpeg" },
  { id: 37, name: "Ti finisce l’acqua in mezzo al deserto", idx: 87, image: "/images/card37.jpeg" },
  { id: 38, name: "Ti sbagliano il tatuaggio tribale", idx: 64, image: "/images/card38.jpeg" },
  { id: 39, name: "Ti rompi un dente mangiando", idx: 53, image: "/images/card39.jpeg" },
  { id: 40, name: "Per sbaglio entri in un bagno turco nudista", idx: 37, image: "/images/card40.jpeg" },
  { id: 41, name: "Scopri che era stagione dei monsoni", idx: 54, image: "/images/card41.jpeg" },
  { id: 42, name: "Ti colpisce una pallonata in spiaggia", idx: 36, image: "/images/card42.jpeg" },
  { id: 43, name: "Ti scambiano per qualcun altro e ti arrestano", idx: 92, image: "/images/card43.jpeg" },
  { id: 44, name: "Ti entra sabbia nel telefono", idx: 44, image: "/images/card44.jpeg" },
  { id: 45, name: "Ti svegli con 40 gradi di febbre", idx: 77, image: "/images/card45.jpeg" },
  { id: 46, name: "Perdi le foto di tutto il viaggio", idx: 83, image: "/images/card46.jpeg" },
  { id: 47, name: "Ti dimentichi l’adattatore di corrente", idx: 42, image: "/images/card47.jpeg" },
  { id: 48, name: "Ti buttano giù dall’elefante per sovrappeso", idx: 90, image: "/images/card48.jpeg" },
  { id: 49, name: "Scivoli nel fango davanti a tutti", idx: 45, image: "/images/card49.jpeg" },
  { id: 50, name: "Ti svegli e il volo era 12 ore prima", idx: 84, image: "/images/card50.jpeg" },
  { id: 51, name: "Uno squalo ti attacca e perdi una gamba", idx: 100, image: "/images/card51.jpeg" }
];

cards.forEach(card => {
  db.run(
    `INSERT OR IGNORE INTO cards (id, name, image,"index") VALUES (?, ?, ?, ?)`,
    [card.id, card.name, card.image ,card.idx],
    function (err) {
      if (err) console.error(`Errore inserimento carta ${card.name}:`, err.message);
    }
  );
});

    
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