import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router"; // Added Link and useNavigate
import API from "../API/API.mjs";
import { Card, Button, Row, Col, Alert } from "react-bootstrap";

function GamePage({ user }) {
  const { userId, gameId } = useParams();
  const navigate = useNavigate(); // For "Back to Profile"
  const [gameState, setGameState] = useState(null);
  const [showNextRoundBtn, setShowNextRoundBtn] = useState(true);
  const [guessResult, setGuessResult] = useState(null);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);
  const [selectedPosition, setSelectedPosition] = useState(null); // For guess confirmation

  // Load game state
  useEffect(() => {
    setGuessResult(null);
    setShowNextRoundBtn(true); // Should typically start with "Start First Round" or "Next Round" button visible
    setSelectedPosition(null);
    setTimer(30); // Reset timer as well
    if (timerRef.current) {
      clearInterval(timerRef.current); // Clear any existing timer interval
    }
    API.getGameState(gameId)
      .then(setGameState)
      .catch(() => setGameState(null));
  }, [gameId]);

  // Timer logic
  useEffect(() => {
    if (!showNextRoundBtn && gameState && gameState.currentRound) {
      // setTimer(30); // Timer is now reset in handleStartRound or if already 0 by this effect
      if (timer !== 30 && gameState.currentRound) { // Ensure timer is set to 30 if not already, for this specific round
          setTimer(30);
      }
      setSelectedPosition(null); // Reset selection
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) { // When timer is about to hit 0 or less
            clearInterval(timerRef.current);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showNextRoundBtn, gameState?.currentRound?.roundId]); // gameState.currentRound.roundId ensures this runs for a new round


  // Handle timer expiration
  useEffect(() => {
    if (timer === 0 && !showNextRoundBtn && gameState && gameState.currentRound) {
      // Interval should have been cleared by the setInterval callback itself or by the other effect
      // if (timerRef.current) { // Defensive clear, though likely already cleared
      //   clearInterval(timerRef.current);
      // }
      if (selectedPosition !== null) {
        handleGuess(selectedPosition); // Submit selected guess if timer expires
      } else {
        handleTimeout(); // No selection made, timeout
      }
      setSelectedPosition(null); // Reset selection after handling
    }
  }, [timer, showNextRoundBtn, gameState, selectedPosition, gameId]); // Added gameId to dependencies for safety, though currentRound.roundId covers new rounds


  const handleStartRound = () => {
    setShowNextRoundBtn(false);
    setGuessResult(null);
    setSelectedPosition(null);
    setTimer(30); // Explicitly reset timer here for the upcoming round
    // The useEffect for timer logic will then pick up and start the interval
    // when gameState.currentRound is updated by the API call.
    API.getGameState(gameId).then(setGameState);
  };

  const handlePositionSelect = (index) => {
    setSelectedPosition(index);
  };

  const handleConfirmGuess = () => {
    if (selectedPosition !== null) {
      handleGuess(selectedPosition);
    }
  };

  const handleGuess = async (position) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    try {
      // Ensure gameState and currentRound are available
      if (!gameState || !gameState.currentRound) {
        setGuessResult("Error: Game state not available for guess.");
        setShowNextRoundBtn(true);
        return;
      }
      const { currentRound } = gameState;
      const newState = await API.guessRound(gameId, currentRound.roundId, position);
      setGameState(newState);
      if (newState.lastGuessCorrect) {
        setGuessResult("Correct! You won the card.");
      } else {
        setGuessResult("Wrong! You lost the card.");
      }
      setShowNextRoundBtn(true);
      setSelectedPosition(null);
    } catch (err) {
      setGuessResult("Error submitting guess.");
      setShowNextRoundBtn(true);
      setSelectedPosition(null);
    }
  };

  const handleTimeout = async () => {
    try {
      // Ensure gameState and currentRound are available
      if (!gameState || !gameState.currentRound) {
        setGuessResult("Error: Game state not available for timeout.");
        setShowNextRoundBtn(true);
        return;
      }
      const { currentRound } = gameState;
      const newState = await API.timeoutRound(gameId, currentRound.roundId);
      setGameState(newState);
      setGuessResult("Time's up! You lost the card.");
      setShowNextRoundBtn(true);
      setSelectedPosition(null);
    } catch (err) {
      setGuessResult("Error processing timeout.");
      setShowNextRoundBtn(true);
      setSelectedPosition(null);
    }
  };

  if (!gameState) return <p>Loading...</p>;

  const { ownedCards, currentRound, mistakes, status } = gameState;

  // Game Over Screen
  if (status === "win" || status === "lose") {
    return (
      <Row className="justify-content-center mt-5">
        <Col xs={12} md={8}>
          <h2>{status === "win" ? "You Win!" : "You Lose!"}</h2>
          <h4>Your cards:</h4>
          <Row>
            {ownedCards.map(card => (
              <Col key={card.id} md={4}>
                <Card className="mb-3">
                  <Card.Img variant="top" src={`http://localhost:3001${card.image}`} />
                  <Card.Body>
                    <Card.Title>{card.name}</Card.Title>
                    <Card.Text>Luck Index: {card.index}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <Button onClick={() => API.startNewGame(user.id).then(data => navigate(`/${user.id}/game/${data.gameId}`))} className="me-2">New Game</Button>
          <Button as={Link} to={`/${userId}`} variant="secondary">Back to Profile</Button>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={8}>
        <h2>Your cards ({ownedCards.length}) <span className="ms-3">Mistakes: {mistakes}/3</span></h2>
        <Row>
          {ownedCards.map(card => (
            <Col key={card.id} md={4}>
              <Card className="mb-3">
                <Card.Img variant="top" src={`http://localhost:3001${card.image}`} />
                <Card.Body>
                  <Card.Title>{card.name}</Card.Title>
                  <Card.Text>Luck Index: {card.index}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <hr />
        {showNextRoundBtn ? (
          <>
            {guessResult && <Alert variant={guessResult.startsWith("Correct") ? "success" : "danger"}>{guessResult}</Alert>}
            <Button onClick={handleStartRound}>
              {ownedCards.length === 3 && mistakes === 0 && !guessResult ? "Start First Round" : "Next Round"}
            </Button>
          </>
        ) : currentRound ? (
          <>
            <h3>New Situation</h3>
            <Alert variant="info">Time remaining: {timer} seconds</Alert>
            <Card className="mb-3">
              <Card.Img variant="top" src={`http://localhost:3001${currentRound.card.image}`} />
              <Card.Body>
                <Card.Title>{currentRound.card.name}</Card.Title>
                <Card.Text>Where does this card fit in your hand (by Luck Index)?</Card.Text>
                <Row>
                 {ownedCards.map((card, idx) => (
                    <Col key={`guess-pos-${idx}`} className="mb-2 d-flex justify-content-center">
                    <Button
                        variant={selectedPosition === idx ? "primary" : "outline-primary"}
                        onClick={() => handlePositionSelect(idx)}
                        style={{width: '100%'}}
                    >
                        {idx === 0
                        ? `Before ${card.index}`
                        : `Between ${ownedCards[idx - 1].index} and ${card.index}`}
                    </Button>
                    </Col>
                ))}
                <Col key="guess-pos-last" className="mb-2 d-flex justify-content-center">
                    <Button
                    variant={selectedPosition === ownedCards.length ? "primary" : "outline-primary"}
                    onClick={() => handlePositionSelect(ownedCards.length)}
                    style={{width: '100%'}}
                    >
                    {ownedCards.length > 0 ? `After ${ownedCards[ownedCards.length - 1].index}` : 'As the first card'}
                    </Button>
                </Col>
                </Row>
                <Button onClick={handleConfirmGuess} disabled={selectedPosition === null} className="mt-3">
                  Confirm Guess
                </Button>
              </Card.Body>
            </Card>
          </>
        ) : (
            <p>Loading next round...</p>
        )}
      </Col>
    </Row>
  );
}

export default GamePage;