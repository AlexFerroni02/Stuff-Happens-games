import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Alert } from "react-bootstrap";
import HandCards from "./HandCards";
import API from "../API/API.mjs";
import { useNavigate } from "react-router";

function DemoPage() {
  const [gameId, setGameId] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [initialCards, setInitialCards] = useState([]);
  const [cardToGuess, setCardToGuess] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const navigate = useNavigate();

  useEffect(() => {
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [roundId]);

  useEffect(() => {
    if (secondsLeft === 0 && gameId && roundId && !result) {
      API.timeoutDemoRound(gameId, roundId).then((timeoutResult) => {
        setResult(timeoutResult);
      });
    }
  }, [secondsLeft, gameId, roundId, result]);

  const startNewDemo = async () => {
    if (gameId) {
      try {
        await API.deleteDemoGame(gameId);
      } catch (delErr) {
        
      }
    }
    setGameId(null);
    setRoundId(null);
    setInitialCards([]);
    setCardToGuess(null);
    setSelectedPosition(null);
    setResult(null);
    setError(null);
    setSecondsLeft(30);
    try {
      const demoData = await API.startDemo();
      setGameId(demoData.gameId);
      setRoundId(demoData.roundId);
      setInitialCards(demoData.initialCards);
      setCardToGuess(demoData.cardToGuess);
    } catch (err) {
      setError(err.message || "Failed to start demo.");
    }
  };
  
  const handleGuess = async () => {
    if (selectedPosition === null || !gameId || !roundId) return;
    try {
      const guessResult = await API.guessDemoRound(gameId, roundId, selectedPosition);
      if (guessResult.correct && guessResult.cardToGuess) {
        setInitialCards([...initialCards, guessResult.cardToGuess].sort((a, b) => a.index - b.index));
      }
      setResult(guessResult);
    } catch (err) {
      setResult({ correct: false, timeout: false, message: err.message || "Error submitting guess." });
    }
  };

  const renderStart = () => (
    <>
      <Card.Text>
        Try to guess where the new misfortune card fits among your hand! (30 sec limit)
      </Card.Text>
      <Button onClick={startNewDemo}>Start Demo</Button>
    </>
  );

  const renderRound = () => (
    <>
      <div className="mb-3">
        <Alert variant={secondsLeft <= 5 ? "danger" : "info"}>
          Time left: <b>{secondsLeft}</b> seconds
        </Alert>
      </div>
      <h5>Your Cards in Hand</h5>
      <HandCards cards={initialCards} />
      <hr />
      <h5>Card to Place</h5>
      {cardToGuess && (
        <Card className="mb-3" style={{ maxWidth: "150px", margin: "0 auto" }}>
          <Card.Img variant="top" src={`http://localhost:3001${cardToGuess.image}`} />
          <Card.Body>
            <Card.Title style={{ fontSize: "1rem" }}>{cardToGuess.name}</Card.Title>
          </Card.Body>
        </Card>
      )}
      <h6>Where would you place it?</h6>
      <Row className="mt-3">
        {initialCards.map((card, idx) => (
          <Col key={`pos-${card.id ?? idx}`} className="mb-2 d-flex justify-content-center">
            <button
              className={`btn ${selectedPosition === idx ? "btn-primary" : "btn-outline-primary"} w-100`}
              onClick={() => setSelectedPosition(idx)}
              disabled={!!result}
            >
              {idx === 0
                ? `Before ${card.index}`
                : `Between ${initialCards[idx - 1].index} and ${card.index}`}
            </button>
          </Col>
        ))}
        <Col key="pos-last" className="mb-2 d-flex justify-content-center">
          <button
            className={`btn ${selectedPosition === initialCards.length ? "btn-primary" : "btn-outline-primary"} w-100`}
            onClick={() => setSelectedPosition(initialCards.length)}
            disabled={!!result}
          >
            {initialCards.length > 0
              ? `After ${initialCards[initialCards.length - 1].index}`
              : "As the first card"}
          </button>
        </Col>
      </Row>
      <div className="mt-3">
        <button
          className="btn btn-success"
          disabled={selectedPosition === null || secondsLeft === 0}
          onClick={handleGuess}
        >
          Confirm Guess
        </button>
      </div>
    </>
  );

  const renderResult = () => (
    <>
      <Alert className="mt-4" variant={result.correct ? "success" : (result.timeout ? "warning" : "danger")}>
        {result.message}
        {result.cardToGuess && (
          <div className="mt-2">
            <b>Luck Index of the card was: {result.cardToGuess.index}</b>
          </div>
        )}
      </Alert>
      <h5>Your Cards in Hand</h5>
      <HandCards cards={initialCards} />
      <div className="mt-3 d-flex gap-2">
        <Button variant="info" onClick={async () => {
            await API.deleteDemoGame(gameId);
            startNewDemo();
          }}>
          Play Again
        </Button>
        <Button variant="secondary" onClick={async () => {
            await API.deleteDemoGame(gameId);
            navigate("/");
          }}>
          Home Page
        </Button>
      </div>
    </>
  );

  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={8} lg={6}>
        <Card className="shadow">
          <Card.Body>
            <Card.Title as="h2">Demo: Play a Single Round</Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}

            {!gameId && renderStart()}
            {gameId && !result && renderRound()}
            {gameId && result && renderResult()}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default DemoPage;