import { Button,Card,  Container, Row, Col} from "react-bootstrap";
import { Link } from "react-router";


function HomePage() {
  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={8} lg={6}>
        <Card className="shadow">
          <Card.Body>
            <Card.Title as="h1" className="mb-3">Stuff Happens</Card.Title>
            <Card.Subtitle as="h4" className="mb-4 text-muted">How to Play</Card.Subtitle>
            <Card.Text>
              1. You start with 3 random misfortune cards, each with a name, image, and a unique misfortune index (from 1 to 100).<br />
              2. In each round, you are shown a new misfortune (not already in your hand) with its name and image, but not its index.<br />
              3. Place the new card where you think its misfortune index fits among your current cards (which are always shown in order).<br />
              4. If you guess the correct position within 30 seconds, you win the card and see all its details.<br />
              5. If you guess wrong or run out of time, you do not win the card and it will not appear again in this game.<br />
              6. Win the game by collecting 6 cards. Lose if you make 3 mistakes.<br /><br />
              <b>Registered users:</b> can play full games and view their match history.<br />
              <b>Visitors:</b> can try a one-round demo game.<br />
            </Card.Text>
            
          </Card.Body>
        </Card>
        <div className="d-flex justify-content-center mt-4">
              <Button as={Link} to="/demo" variant="outline-primary">
                Try Demo
              </Button>
        </div>
      </Col>
    </Row>
  );
}




export default HomePage;