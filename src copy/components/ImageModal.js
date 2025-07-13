import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import './ImageModal.css';

const ImageModal = ({ show, onHide, image, images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const currentImage = images ? images[currentIndex] : image;
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="image-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{currentImage?.caption || currentImage?.alt}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 position-relative">
        <img
          src={currentImage?.src}
          alt={currentImage?.alt}
          className="img-fluid w-100"
        />
        {images && (
          <Row className="mx-0 mt-3">
            <Col className="d-flex justify-content-between px-3">
              <Button variant="outline-primary" onClick={handlePrevious}>
                Previous
              </Button>
              <Button variant="outline-primary" onClick={handleNext}>
                Next
              </Button>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageModal;