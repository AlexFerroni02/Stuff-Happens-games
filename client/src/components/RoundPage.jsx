import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../API/API.mjs";
import { Card, Row, Col, Alert, Button } from "react-bootstrap";
import HandCards from "./HandCards";

function RoundPage(user) {
  const { gameId, roundId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState();
  const [selectedPosition, setSelectedPosition] = useState();
  const [roundResult, setRoundResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    setSecondsLeft(30); // resetta ogni round
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [roundId]);

  useEffect(() => {
  if (secondsLeft === 0 && gameState?.currentRound) {
      
      API.timeoutRound(gameId, roundId).then((result) => {
        navigate(`/game/${gameId}/round/${roundId}/end`, { state: { roundResult: result } });
      });
    }
  }, [secondsLeft]);

  const getRoundState = async () => {
    const data = await API.getRoundState(gameId, roundId);
    setGameState(data);
    setRoundResult(null);
    setSelectedPosition(null);
  };

  useEffect(() => {
    getRoundState();
   
  }, [gameId, roundId]);

  if (!gameState) return <div>Loading...</div>;

  const { mistakes, status, currentRound, ownedCards } = gameState;

  const handleConfirmGuess = async () => {
    try {
      const result = await API.guessRound(gameId, roundId, selectedPosition);
      navigate(`/game/${gameId}/round/${roundId}/end`, { state: { roundResult: result } });
      
    } catch (err) {
      setRoundResult("Error submitting your answer");
    }
  };
  


  return (
    <Row className="justify-content-center mt-5">
        <Col xs={12} md={8}>
       
        <ErrorsAlert mistakes={mistakes} />
        
        <div className="mb-3">
        <Alert variant={secondsLeft <= 5 ? "danger" : "info"}>
          Time left: <b>{secondsLeft}</b> seconds
        </Alert>
      </div>
        
        <h2>Your cards in hand ({ownedCards.length})</h2>
        <HandCards cards={ownedCards} />
        <hr />

        {currentRound && !roundResult && (
            <>
            <h3>Card to place:</h3>
            <CardToPlace card={currentRound.card} />
            <PositionSelector
                ownedCards={ownedCards}
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
            />
            <button
                className="btn btn-success mt-3"
                disabled={selectedPosition === null}
                onClick={handleConfirmGuess}
            >
                Confirm Guess
            </button>
            </>
        )}

        </Col>
    </Row>
    );
}

  function ErrorsAlert({ mistakes }) {
    return (
      <Alert variant={mistakes > 0 ? "danger" : "info"}>
        Mistakes: <b>{mistakes}</b> / 3
      </Alert>
    );
  }

function PositionSelector({ ownedCards, selectedPosition, setSelectedPosition }) {
  return (
    <Row className="mt-3">
      {ownedCards.map((card, idx) => (
        <Col key={`pos-${idx}`} className="mb-2 d-flex justify-content-center">
          <button
            className={`btn ${selectedPosition === idx ? "btn-primary" : "btn-outline-primary"} w-100`}
            onClick={() => setSelectedPosition(idx)}
          >
            {idx === 0
              ? `Before ${card.index}`
              : `Between ${ownedCards[idx - 1].index} and ${card.index}`}
          </button>
        </Col>
      ))}
      <Col key="pos-last" className="mb-2 d-flex justify-content-center">
        <button
          className={`btn ${selectedPosition === ownedCards.length ? "btn-primary" : "btn-outline-primary"} w-100`}
          onClick={() => setSelectedPosition(ownedCards.length)}
        >
          {ownedCards.length > 0
            ? `After ${ownedCards[ownedCards.length - 1].index}`
            : "As the first card"}
        </button>
      </Col>
    </Row>
  );
}

function CardToPlace({ card }) {
  return (
    <Card className="mb-3" style={{ maxWidth: "150px", margin: "0 auto" }}>
      <Card.Img variant="top" src={`http://localhost:3001${card.image}`} />
      <Card.Body>
        <Card.Title style={{ fontSize: "1rem" }}>{card.name}</Card.Title>
        <Card.Text style={{ fontSize: "0.95rem" }}>Luck Index: {card.index}</Card.Text>
      </Card.Body>
    </Card>
  );
}

export default RoundPage;