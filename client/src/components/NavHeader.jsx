import { useEffect, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { Link } from "react-router";
import { LogoutButton } from './AuthComponents';


function NavHeader(props) {
  

  return(
    <Navbar bg='primary' data-bs-theme='dark'>
      <Container fluid>
      <Navbar.Brand className="text-white" style={{ cursor: "default" }}>
        Stuff Happens
      </Navbar.Brand>
      {props.loggedIn ? 
        <LogoutButton logout={props.handleLogout} /> :
        <Link to='/login'className='btn btn-outline-light'>Login</Link>
      }
      </Container>
    </Navbar>
  );
}

export default NavHeader;