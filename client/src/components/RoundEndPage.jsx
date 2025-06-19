import { useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import API from "../API/API.mjs";
import { Alert, Button } from "react-bootstrap";
import HandCards from "./HandCards";

function RoundEndPage(user) {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);

  
  useEffect(() => {
    const fetchState = async () => {
      // con ? evitiamo errori se state è undefined
      const lastResult = location.state?.roundResult;
      if (lastResult) {
        setGameState(lastResult);
      } else{
        setGameState({ error: "Impossibile recuperare il risultato del round. Torna al profilo o riprova." });
      }
    };
    fetchState();
  }, [location.state]);
  useEffect(() => {
  if (gameState && (gameState.status === "win" || gameState.status === "lose")) {
    navigate(`/game/${gameId}/end`);
  }
}, [gameState]);

  if (!gameState) return <div>Loading...</div>;

  const { ownedCards, mistakes, status, lastGuessCorrect,timeout } = gameState;

  
let resultMsg = "";
let resultVariant = "info";
if (status === "win") {
  resultMsg = "You won the game! Congratulations!";
  resultVariant = "success";
} else if (status === "lose") {
  resultMsg = "You lost the game!";
  resultVariant = "danger";
} else if (timeout) {
  resultMsg = "Time's up! You didn't answer in time and lost this round.";
  resultVariant = "warning";
} else if (lastGuessCorrect) {
  resultMsg = "You guessed right! The card has been added to your hand.";
  resultVariant = "success";
} else {
  resultMsg = "Wrong guess! You don't get the card.";
  resultVariant = "danger";
}

 
  const handleNextRound = async () => {
    try {
      const response = await API.startNewRound(gameId);
      if (response.roundId) {
        navigate(`/game/${gameId}/round/${response.roundId}`);
      } else {
        
         navigate(`/game/${gameId}/end`)
      }
    } catch (err) {
      navigate(`/profile`);
    }
  };

  return (
    <div className="mt-5">
      <Alert variant={resultVariant}>{resultMsg}</Alert>
      <Alert variant="info">Mistakes: <b>{mistakes}</b> / 3</Alert>
      <h2>Your cards in hand</h2>
      <HandCards cards={ownedCards} />
      <hr />
      {status === "in_progress" && (
        <Button className="mt-3" onClick={handleNextRound}>
          Next round
        </Button>
      )}
      
    </div>
  );
}

export default RoundEndPage;