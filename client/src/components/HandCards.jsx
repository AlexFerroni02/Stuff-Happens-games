import { Card, Row, Col } from "react-bootstrap";

function HandCards({ cards }) {
  return (
    <Row>
      {cards.map(card => (
        <Col key={card.id} md={4}>
          <Card className="mb-3" style={{ maxWidth: "150px", margin: "0 auto" }}>
            <Card.Img variant="top" src={`http://localhost:3001${card.image}`} />
            <Card.Body>
              <Card.Title>{card.name}</Card.Title>
              <Card.Text>Unluck Index: {card.index}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default HandCards;