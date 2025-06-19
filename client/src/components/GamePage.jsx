import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import API from "../API/API.mjs";
import { Card, Button, Row, Col } from "react-bootstrap";
import HandCards from "./HandCards";
function GamePage({ user }) {
  const {  gameId } = useParams();
  
  const navigate = useNavigate();

  
  const [ownedCards, setOwnedCards] = useState([]);
  useEffect(() => {
    const fetchInitialCards = async () => {
      try {
        const { initialCards } = await API.getInitialCards(gameId);
        setOwnedCards(initialCards);
      } catch (err) {
        setOwnedCards([]);
      }
    };
    fetchInitialCards();
  }, [gameId]);

  const handleStartRound = async () => {
  try {
    
    const response = await API.startNewRound(gameId);
   
    navigate(`/game/${gameId}/round/${response.roundId}`);
  } catch (err) {
    alert("Unable to start new round: " + err.message);
  }
};

  return (
    <div className="mt-4">
      <h2>Your Cards</h2>
      <HandCards cards={ownedCards} />
      <Button onClick={handleStartRound} className="mt-3">
        Start New Round
      </Button>
    </div>
  );
}

export default GamePage;