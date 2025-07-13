import React, { useState, useEffect } from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faPaw, 
  faImages, 
  faExpand,
  faClock,
  faGamepad,
  faHeart,
  faStar,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import './RoomCarousel.css';
import ImageModal from './ImageModal';

const RoomCarousel = ({ roomType }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Enhanced room data with more details
  const roomData = {
    deluxe: {
      title: "Deluxe Room",
      rating: 4.2,
      price: "₱800/night",
      features: ["24/7 Pet Sitter", "1 Hour Play Time", "Regular Bed", "Food Bowls"],
      description: "Regular Room Gated with 24/7 Pet Sitter, Well Ventilated, (1) HOUR Access in Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Regular Bed and Food Bowls + Treats, Good for Small/Medium Sizes, Real-Time Updates.",
      catNote: "For CATS: Inclusive of Litter Boxes and Scratch Pads",
      color: "#4CAF50"
    },
    premium: {
      title: "Premium Room",
      rating: 4.6,
      price: "₱1,200/night",
      features: ["24/7 Pet Sitter", "2 Hours Play Time", "Premium Bed", "Ceramic Bowls"],
      description: "Premium Gated Room with 24/7 Pet Sitter, Well Ventilated, (2) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Premium Bed and Ceramic Bowls + Treats, Good for Small/Medium Sizes, Real-Time Updates.",
      catNote: "For CATS: Inclusive of Litter Boxes and Scratch Pads",
      color: "#FF9800"
    },
    executive: {
      title: "Executive Suite",
      rating: 4.9,
      price: "₱1,800/night",
      features: ["24/7 Pet Sitter", "3 Hours Play Time", "Air Purifier", "Photo Shoot"],
      description: "Premium Full Room with 24/7 Pet Sitter, Good for SOLO or Groups, Well Ventilated with AIR PURIFIER, (3) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Premium Bed and Ceramic Bowls + Treats, Good for Small/Medium Sizes, Real-Time Updates, Free Soft Copy Photo Shoot.",
      catNote: "For CATS: Inclusive of Litter Boxes and Scratch Pads. +₱500/night room fee (for all sizes)",
      color: "#9C27B0"
    },
    daycare: {
      title: "Pet Daycare",
      features: ["Minimum 6 Hours", "Professional Staff", "Play Area Access", "Water & Bowls"],
      description: "Minimum of (6) Hours supervised daycare service with professional pet sitters. Includes play area access, water, bowls, and comfortable resting areas. Perfect for pets that need daytime care and socialization.",
      pricing: "Small (₱350), Medium (₱450), Large (₱500), Extra-Large (₱600). Additional ₱80 per hour exceeded.",
      color: "#2196F3"
    }
  };

  const roomImages = {
    daycare: [
      {
        src: require('../assets/grooming1.jpg'),
        alt: 'Indoor Play Area',
        caption: 'Spacious Indoor Play Area'
      },
      {
        src: require('../assets/Rabbit.jpg'),
        alt: 'Outdoor Area',
        caption: 'Fresh Air Outdoor Space'
      },
      {
        src: require('../assets/Pet Playing2.jpg'),
        alt: 'Pet Sitting',
        caption: 'Professional Pet Care'
      },
      {
        src: require('../assets/Pet Playing2.jpg'),
        alt: 'Feeding Area',
        caption: 'Dedicated Feeding Zone'
      }
    ],
    deluxe: [
      {
        src: require('../assets/Delux2.jpg'),
        alt: 'Deluxe Room Overview',
        caption: 'Comfortable and secure deluxe accommodation'
      },
      {
        src: require('../assets/Delux2.jpg'),
        alt: 'Deluxe Room Interior',
        caption: 'Well-ventilated space with regular amenities'
      },
      {
        src: require('../assets/Delux1.jpg'),
        alt: 'Deluxe Play Area Access',
        caption: 'Daily play area access included'
      }
    ],
    premium: [
      {
        src: require('../assets/premium.jpg'),
        alt: 'Premium Room',
        caption: 'Upgraded premium accommodation'
      },
      {
        src: require('../assets/premium.jpg'),
        alt: 'Premium Amenities',
        caption: 'Enhanced comfort with ceramic bowls'
      }
    ],
    executive: [
      {
        src: require('../assets/exclusive.jpg'),
        alt: 'Executive Suite',
        caption: 'Luxurious executive suite experience'
      },
      {
        src: require('../assets/exclusive.jpg'),
        alt: 'Executive Amenities',
        caption: 'Premium amenities with air purifier'
      }
    ]
  };

  // Add safety checks to handle cases where roomType doesn't match our data keys
  const currentRoom = roomData[roomType] || {
    title: "Room",
    rating: 4.0,
    price: "Price not available",
    features: ["Details not available"],
    description: "Room details not available",
    color: "#333"
  };
  
  // Ensure we have images for the room type or use a fallback
  const images = roomImages[roomType] || [
    { 
      src: require('../assets/Delux1.jpg'), 
      alt: 'Room Image',
      caption: 'Room image'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && images && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, images]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
    setIsAutoPlaying(false);
  };

  const handleAlbumClick = () => {
    setShowAlbum(true);
    setSelectedImage(images[0]);
    setIsAutoPlaying(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // This check is no longer needed since we provide fallbacks above

  return (
    <div className="room-carousel-wrapper">
      {/* Room Header - Title only without price or rating */}
      <div className="room-header">
        <div className="room-title-section">
          <h4 className="room-title">{currentRoom.title}</h4>
        </div>
      </div>

      {/* Enhanced Image Carousel */}
      <div className="room-carousel" style={{ position: 'relative' }}>
        {imageLoading && (
          <div className="image-loading-overlay">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        
        <img
          className="d-block w-100 main-image"
          src={images[currentImageIndex]?.src || require('../assets/Delux1.jpg')}
          alt={images[currentImageIndex]?.alt || 'Room image'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleImageClick(images[currentImageIndex] || images[0])}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        
        {/* Image Counter */}
        <div className="image-counter">
          {currentImageIndex + 1} / {images.length}
        </div>

        {/* Auto-play indicator */}
        <div className="autoplay-indicator" onClick={toggleAutoPlay}>
          <div className={`autoplay-dot ${isAutoPlaying ? 'active' : ''}`}></div>
        </div>
        
        {/* Enhanced Navigation */}
        <Button
          variant="link"
          className="nav-button nav-button-left"
          onClick={prevImage}
          disabled={images.length <= 1}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
        
        <Button
          variant="link"
          className="nav-button nav-button-right"
          onClick={nextImage}
          disabled={images.length <= 1}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button
            variant="primary"
            size="sm"
            className="action-btn view-album-btn"
            onClick={handleAlbumClick}
          >
            <FontAwesomeIcon icon={faImages} className="me-1" />
            View All ({images.length})
          </Button>
          
          <Button
            variant="outline-light"
            size="sm"
            className="action-btn expand-btn"
            onClick={() => handleImageClick(images[currentImageIndex])}
          >
            <FontAwesomeIcon icon={faExpand} />
          </Button>
        </div>

        {/* Thumbnail Navigation */}
        <div className="thumbnail-navigation">
          {images.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsAutoPlaying(false);
              }}
              style={{ backgroundImage: `url(${image?.src || require('../assets/Delux1.jpg')})` }}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Room Features */}
      <div className="room-features-section">
        <div className="features-grid">
          {(currentRoom.features || []).map((feature, index) => (
            <div key={index} className="feature-item">
              <FontAwesomeIcon icon={faCheck} className="feature-icon" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Description */}
      <div className="room-description-section">
        <div className="description-header">
          <FontAwesomeIcon icon={faPaw} className="paw-icon" />
          <span className="description-title">{roomType === 'daycare' ? 'Daycare Details' : 'Room Details'}</span>
        </div>
        
        <div className={`description-content ${showFullDescription ? 'expanded' : ''}`}>
          <p className="description-text">{currentRoom.description}</p>
          
          {/* Pet daycare pricing */}
          {roomType === 'daycare' && currentRoom.pricing && (
            <div className="daycare-pricing">
              <div className="pricing-header">
                <FontAwesomeIcon icon={faClock} className="pricing-icon" />
                <span className="pricing-title">Pricing</span>
              </div>
              <p className="pricing-text">{currentRoom.pricing}</p>
            </div>
          )}
          
          {/* Cat note for overnight rooms */}
          {roomType !== 'daycare' && currentRoom.catNote && (
            <div className="cat-note">
              <FontAwesomeIcon icon={faHeart} className="cat-icon" />
              <span>{currentRoom.catNote}</span>
            </div>
          )}
        </div>

        <Button
          variant="link"
          size="sm"
          className="toggle-description"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? 'Show Less' : 'Read More'}
        </Button>
      </div>
      
      <ImageModal
        show={showModal || showAlbum}
        onHide={() => {
          setShowModal(false);
          setShowAlbum(false);
          setIsAutoPlaying(true);
        }}
        image={selectedImage || (images && images[0]) || null}
        images={showAlbum && images && images.length > 0 ? images : null}
      />
    </div>
  );
};

export default RoomCarousel;