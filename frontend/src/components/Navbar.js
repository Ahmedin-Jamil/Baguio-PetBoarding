import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCalendarCheck, faStar } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/123.jpg';
import './Navbar.css';

const NavigationBar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };
  return (
    <Navbar bg="light" variant="light" expand="lg" sticky="top" className="custom-navbar">
      <Container>
        <Navbar.Brand>
          <img src={logo} alt="Pet logo" className="me-2" /> Baguio Pet Boarding
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="nav-link">
              <FontAwesomeIcon icon={faHome} className="me-1" /> Home
            </Nav.Link>
            <Nav.Link as={Link} to="/search-booking" className="nav-link">
              <FontAwesomeIcon icon={faCalendarCheck} className="me-1" /> My Booking
            </Nav.Link>
            <Nav.Link href="https://www.facebook.com/BaguioPetBoardingPh/reviews" target="_blank" rel="noopener noreferrer" className="nav-link">
              <FontAwesomeIcon icon={faStar} className="me-1" /> Reviews
            </Nav.Link>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;