// RoomTypeDropdown.js
// A dropdown button that expands to show three room types in columns.
// Clicking a room type opens a modal carousel displaying that room's images.

import React, { useState } from 'react';
import { Button, Row, Col, Modal, Carousel } from 'react-bootstrap';
import deluxeImg from '../assets/deluxe.jpg';
import deluxe1Img from '../assets/cat_deluxe.jpg';
import deluxe2Img from '../assets/deluxe_dog.jpg';
import premiumImg from '../assets/premium.jpg';
import premium2Img from '../assets/cat_premium.jpg';
import premium3Img from '../assets/premium_enterence.jpg';
import premium1Img from '../assets/play_area_2.jpg';
import premium4Img from '../assets/executive.jpg';
import executiveImg from '../assets/executive1.jpg';
import executive1Img from '../assets/food.jpg';
import executive2Img from '../assets/execu.jpg';
import './RoomTypeDropdown.css';

const RoomTypeDropdown = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const roomData = {
    'Deluxe Room': {
      images: [deluxeImg,deluxe2Img,deluxe1Img],
    },
    'Premium Room': {
      images: [premium3Img, premiumImg,premium1Img,premium2Img],
    },
    'Executive Room': {
      images: [executiveImg,premium4Img,executive2Img,executive1Img],
    },
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  return (
    <div className="room-type-dropdown-wrapper text-center mb-4">
      <Button variant="primary" className="room-dropdown-btn" onClick={toggleDropdown}>
        View Rooms Images
      </Button>

      {showDropdown && (
        <div className="room-dropdown-panel shadow-lg p-3 bg-white rounded">
          <Row>
            {Object.keys(roomData).map((room) => (
              <Col key={room} md={4} className="mb-3">
                <div
                  className="room-option-card h-100 d-flex flex-column align-items-center justify-content-center px-2 py-3"
                  onClick={() => handleRoomSelect(room)}
                  role="button"
                >
                  <img src={roomData[room].images[0]} alt={room} className="room-thumb mb-2" />
                  <h6 className="mb-0 text-center">{room}</h6>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Modal to show room images */}
      <Modal size="lg" show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedRoom}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRoom && (
            <Carousel>
              {roomData[selectedRoom].images.map((imgSrc, idx) => (
                <Carousel.Item key={idx}>
                  <img src={imgSrc} className="d-block w-100" alt={`${selectedRoom} ${idx + 1}`} />
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RoomTypeDropdown;
