import React, { useState } from 'react';
import { Modal, Button, Carousel, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faExpand } from '@fortawesome/free-solid-svg-icons';
import './PhotoGalleryModal.css';

const PhotoGalleryModal = ({ show, onHide, images, title }) => {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className={`photo-gallery-modal ${fullscreen ? 'fullscreen-modal' : ''}`}
    >
      <Modal.Header>
        <Modal.Title>{title || 'Photo Gallery'}</Modal.Title>
        <div className="modal-controls">
          <Button variant="link" onClick={toggleFullscreen} className="fullscreen-btn">
            <FontAwesomeIcon icon={faExpand} />
          </Button>
          <Button variant="link" onClick={onHide} className="close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Carousel
          activeIndex={index}
          onSelect={handleSelect}
          interval={null}
          indicators={true}
          controls={true}
          prevIcon={<FontAwesomeIcon icon={faChevronLeft} size="2x" />}
          nextIcon={<FontAwesomeIcon icon={faChevronRight} size="2x" />}
        >
          {images && images.map((image, idx) => (
            <Carousel.Item key={idx}>
              <div className="carousel-image-container">
                <img
                  className="d-block w-100 carousel-image"
                  src={image.src}
                  alt={image.alt || `Slide ${idx + 1}`}
                />
              </div>
              {image.caption && (
                <Carousel.Caption>
                  <p>{image.caption}</p>
                </Carousel.Caption>
              )}
            </Carousel.Item>
          ))}
        </Carousel>

        <Container className="mt-3 thumbnail-container">
          <Row>
            {images && images.map((image, idx) => (
              <Col xs={3} md={2} key={idx} className="mb-2">
                <div 
                  className={`thumbnail ${index === idx ? 'active' : ''}`}
                  onClick={() => setIndex(idx)}
                >
                  <img 
                    src={image.src} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="img-fluid"
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
};

export default PhotoGalleryModal;