import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import API from "../API/API.mjs";
import { Alert, Button } from "react-bootstrap";
import HandCards from "./HandCards";

function GameEndPage(user) {
  const {  gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await API.getRoundState(gameId, -1); 
        setGameState(response);
      } catch (err) {
        setGameState({ error: "Failed to load game state" });
      }
    };
    fetchGameState();
  }, [gameId]);

  if (!gameState) return <div>Loading...</div>;
  if (gameState.error) return <Alert variant="danger">{gameState.error}</Alert>;

  const { ownedCards, status } = gameState;

  return (
    <div className="mt-5 text-center">
      <Alert variant={status === "win" ? "success" : "danger"}>
        {status === "win" ? "You won the game! Congratulations!" : "You lost the game!"}
      </Alert>
      <h2>Your final cards</h2>
      <HandCards cards={ownedCards} />
      <div className="mt-4 d-flex justify-content-center gap-3">
        <Button variant="primary" onClick={() => navigate(`/profile`)}>
          Back to Profile
        </Button>
        <Button variant="success" onClick={async () => {
          const { gameId: newGameId, initialCards } = await API.startNewGame(user.id);
          navigate(`/game/${newGameId}`, { state: { initialCards } });
        }}>
          Start New Game
        </Button>
      </div>
    </div>
  );
}

export default GameEndPage;