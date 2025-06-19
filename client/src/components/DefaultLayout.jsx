import { Alert, Container, Row } from "react-bootstrap";
import { Outlet } from "react-router";
import NavHeader from "./NavHeader";

function DefaultLayout(props) {
  // Controlla che message sia un oggetto e abbia la proprietà 'msg'
  const showAlert = props.message && typeof props.message === 'object' && props.message.msg;
  
  return(
    <>
      <NavHeader loggedIn={props.loggedIn} handleLogout={props.handleLogout} />
      <Container fluid className="mt-3">
        {showAlert && (
          <Row>
            
            <Alert
              
              variant={props.message.type}
              onClose={() => props.setMessage('')}
              dismissible
            >
              {props.message.msg}
            </Alert>
          </Row>
        )}
        <Outlet />
      </Container>
    </>
  );
}

export default DefaultLayout;