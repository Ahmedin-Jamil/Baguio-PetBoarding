// GroomingImagesDropdown.js
// Dropdown/modal to showcase grooming service images.

import React, { useState } from 'react';
import { Button, Modal, Carousel } from 'react-bootstrap';
import groomingImg1 from '../assets/Grooming.png';
import groomingImg2 from '../assets/grooming1.jpg';
import groomingImg3 from '../assets/gro.jpg';
import './GroomingImagesDropdown.css';

const GroomingImagesDropdown = () => {
  const [show, setShow] = useState(false);

  const images = [ groomingImg3,groomingImg2];

  return (
    <>
      <Button variant="primary" className="grooming-images-btn" onClick={() => setShow(true)}>
        View Grooming Images
      </Button>

      <Modal size="lg" centered show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Grooming Facilities</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel>
            {images.map((src, idx) => (
              <Carousel.Item key={idx}>
                <img src={src} alt={`Grooming ${idx + 1}`} className="d-block w-100" />
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default GroomingImagesDropdown;
