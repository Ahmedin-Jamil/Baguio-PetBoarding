// DaycareImagesDropdown.js
// Dropdown button to preview daycare facility images.

import React, { useState } from 'react';
import { Button, Modal, Carousel } from 'react-bootstrap';
import daycareImg1 from '../assets/daycare0.jpg';
import daycareImg2 from '../assets/walk.jpg';
import daycareImg3 from '../assets/play.jpg';
import daycareImg4 from '../assets/teeth.jpg';
import daycareImg5 from '../assets/baby.jpg';
import './DaycareImagesDropdown.css';

const DaycareImagesDropdown = () => {
  const [open, setOpen] = useState(false);

  const daycareImages = [ daycareImg4,daycareImg2, daycareImg5, daycareImg3,daycareImg1];

  return (
    <>
      <Button
        variant="primary"
        className="daycare-images-btn"
        onClick={() => setOpen(true)}
      >
        View Daycare Images
      </Button>

      <Modal size="lg" show={open} onHide={() => setOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Daycare Facilities</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel>
            {daycareImages.map((src, index) => (
              <Carousel.Item key={index}>
                <img
                  src={src}
                  alt={`Daycare ${index + 1}`}
                  className="d-block w-100"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DaycareImagesDropdown;
