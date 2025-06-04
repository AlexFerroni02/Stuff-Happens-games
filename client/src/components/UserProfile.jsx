import { useNavigate } from "react-router";
import { Button, Container, Card, ListGroup, Row, Col, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import API from "../API/API.mjs";
import dayjs from "dayjs";

function UserProfile({ user }) {
  const navigate = useNavigate();
  const [gamesList, setGamesList] = useState([]);

  useEffect(() => {
  if (user && user.id) {
    API.getGamesWithDetails()
      .then(setGamesList)
      .catch(() => setGamesList([]));
  }
}, [user,gamesList.length]); // da vedere se da problemi con il ciclo infinito o funziona bene

  return (
    <Container className="mt-4">
      <Row className="justify-content-center mb-4">
        <Col md={8} className="text-center">
          {user && <h2 className="mb-3">Welcome, {user.username}!</h2>}
          <Button
            variant="primary"
            size="lg"
            onClick={async () => {
              const { gameId } = await API.startNewGame(user.id);
                navigate(`/${user.id}/game/${gameId}`);
            }}
            disabled={!user}
          >
            New Game
          </Button>
        </Col>
      </Row>

      {user && (
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <h3 className="mb-3 text-center">Your Games</h3>
            {gamesList.length === 0 ? (
              <Alert variant="info" className="my-3">No games played yet.</Alert>
            ) : (
              <ListGroup>
                {gamesList.map((game) => (
                  <ListGroup.Item key={game.id} className="mb-3 shadow-sm p-0">
                    <Card>
                      <Card.Header as="h5">
                        Game on {dayjs(game.date).format("DD MMMM YYYY, HH:mm")} - 
                        Result: <span className={game.status === 'win' ? 'text-success fw-bold' : game.status === 'lose' ? 'text-danger fw-bold' : 'text-secondary fw-bold'}>
                          {game.status ? game.status.toUpperCase() : 'IN PROGRESS'}
                        </span>
                        
                        <span className="fw-bold"> Cards: {game.totalCards}</span>
                      </Card.Header>
                      <Card.Body>
                        {game.rounds_details && (
                          <>
                            <h6 className="mt-3">Cards in this game:</h6>
                            <ListGroup variant="flush">

                              {[...game.rounds_details]
                                .sort((a, b) => {
                                  // Prima quelli 'initial'
                                  if (a.status === 'initial' && b.status !== 'initial') return -1;
                                  if (a.status !== 'initial' && b.status === 'initial') return 1;
                                  // Poi per roundNumber crescente (null/undefined alla fine)
                                  if (a.roundNumber == null && b.roundNumber != null) return 1;
                                  if (a.roundNumber != null && b.roundNumber == null) return -1;
                                  if (a.roundNumber == null && b.roundNumber == null) return 0;
                                  return a.roundNumber - b.roundNumber;
                                })
                                .map((round, idx) => (
                                  <ListGroup.Item key={idx}>
                                    <strong>{round.cardName}</strong>
                                    {round.status === 'initial' && <span className="ms-2 badge bg-secondary">Initial</span>}
                                    {round.status === 'won' && <span className="ms-2 badge bg-success">Won (Round {round.roundNumber})</span>}
                                    {round.status === 'lost' && <span className="ms-2 badge bg-danger">Lost (Round {round.roundNumber})</span>}
                                  </ListGroup.Item>
                                ))}
                            </ListGroup>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
}
export default UserProfile;