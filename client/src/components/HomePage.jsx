import { Button,Card,  Container, Row, Col} from "react-bootstrap";
import { Link } from "react-router";


function HomePage() {
  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={8} lg={6}>
        <Card className="shadow">
          <Card.Body>
            <Card.Title as="h1" className="mb-3">Luckless Life</Card.Title>
            <Card.Subtitle as="h4" className="mb-4 text-muted">How to Play</Card.Subtitle>
            <Card.Text>
              1. You start with 3 random misfortune cards.<br />
              2. Each round, guess where a new misfortune fits among your cards.<br />
              3. If you guess right, you win the card. If not, you lose the round.<br />
              4. Win by collecting 6 cards, lose after 3 mistakes.<br /><br />
              <b>Log in</b> to play a full game and track your history!<br />
              <b>Try Demo</b> to play a single round without registration.
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