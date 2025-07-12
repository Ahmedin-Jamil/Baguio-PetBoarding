import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import premiumImg from '../assets/premium.jpg';
import deluxeImg from '../assets/deluxe.jpg';
import executiveImg from '../assets/executive1.jpg';
import daycareImg from '../assets/daycare0.jpg';
import groomingImg from '../assets/Grooming.png';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail, ChevronRight } from 'lucide-react';
import BookingWidget from '../components/BookingWidget';
import ServiceCard from '../components/ServiceCard';
import RoomTypeDropdown from '../components/RoomTypeDropdown';
import DaycareImagesDropdown from '../components/DaycareImagesDropdown';
import GroomingImagesDropdown from '../components/GroomingImagesDropdown';
import './HomeNew.css';



const HomeNew = () => {
  const navigate = useNavigate();
  
  // State for selected service from booking widget
  const [selectedService, setSelectedService] = useState(null);

  // Handle service selection from booking widget
  const handleServiceSelect = (serviceData) => {
    setSelectedService(serviceData);
  };

  // Services data with support for sliding cards
  const services = [
    {
      id: 1,
      title: "OVERNIGHT STAYS",
      cardType: "sliding",
      options: [
        {
          name: "Deluxe Room",
          image: deluxeImg,
          description: "Regular Room Gated with 24/7 Pet Sitter, Well Ventilated, (1) HOUR Access in Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Regular Bed and Food Bowls + Treats.",
          catNote: "**For CATS: Inclusive of Litter Boxes and Scratch Pads",
          pricing: [
            { size: "Small", price: "500", weight: "1-9 KG" },
            { size: "Medium", price: "650", weight: "9-25 KG" },
            { size: "Large", price: "750", weight: "25-40 KG" },
            { size: "Extra-Large", price: "1000", weight: "40+ KG" }
          ],
          
        },
        {
          name: "Premium Room",
          image: premiumImg,
          description: "Premium Gated Room with 24/7 Pet Sitter, Well Ventilated, (2) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Premium Bed and Ceramic Bowls + Treats.",
          catNote: "**For CATS: Inclusive of Litter Boxes and Scratch Pads",
          pricing: [
            { size: "Small", price: "650", weight: "1-9 KG" },
            { size: "Medium", price: "800", weight: "9-25 KG" },
            { size: "Large", price: "1000", weight: "25-40 KG" },
            { size: "Extra-Large", price: "1500", weight: "40+ KG" }
          ],
          
        },
        {
          name: "Executive Suite",
          image: executiveImg,
          description: "Premium Full Room with 24/7 Pet Sitter, Good for SOLO or Groups, Well Ventilated with AIR PURIFIER, (3) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Premium Bed and Ceramic Bowls + Treats.",
          catNote: "**For CATS: Inclusive of Litter Boxes and Scratch Pads",
          pricing: [
            { size: "Small", price: "650", weight: "1-9 KG" },
            { size: "Medium", price: "850", weight: "9-25 KG" },
            { size: "Large", price: "1000", weight: "25-40 KG" },
            { size: "Extra-Large", price: "1500", weight: "40+ KG" }
          ],
          
        }
      ],
      features: [
        "24/7 Supervision",
        "Daily Walks",
        "Medication Administration",
        "Bedding & Toys",
        "Playtime",
        "Real-Time Updates"
      ],
      availableSlots: [10, 10, 2] // Slots for Deluxe, Premium, Executive
    },
    {
      id: 2,
      title: "PET DAYCARE",
      cardType: "single",
      image: daycareImg,
      description: "Our day care services provide your pet with supervised play, socialization, and exercise in a safe, fun environment. Minimum of (6) Hours.",
      pricing: [
        { size: "Small", price: "350", weight: "1-9 KG" },
        { size: "Medium", price: "450", weight: "9-25 KG" },
        { size: "Large", price: "500", weight: "25-40 KG" },
        { size: "Extra-Large", price: "600", weight: "40+ KG" }
      ],
      note: "Payment is face-to-face after pet measurement and document verification",
      availableSlots: 10
    },
    {
      id: 3,
      title: "GROOMING SERVICES",
      cardType: "sliding",
      options: [
        {
          name: "Basic Bath & Dry",
          image: groomingImg,
          description: "A thorough cleansing bath with organic shampoo and conditioner. Perfect for pets who need a quick refresh.",
          pricing: [
            { size: "Small", weight: "1-9 KG", price: "350" },
            { size: "Medium", weight: "9-25 KG", price: "450" },
            { size: "Large", weight: "25-40 KG", price: "550" },
            { size: "X-Large", weight: "40+ KG", price: "750" },
            { size: "Cat", weight: <br></br>, price: "500" }
          ],
          additionalFee: "Blowdry, Perfume & Powder (Optional)"
        },
        {
          name: "Premium Grooming",
          image: "https://img.freepik.com/premium-photo/professional-male-groomer-making-haircut-poodle-teacup-dog-grooming-salon-with-professional-equipment_194143-9511.jpg?ga=GA1.1.175165772.1749993901&semt=ais_hybrid&w=740",
          description: "Complete grooming package including bath, haircut, styling, ear cleaning, teeth brushing. Considered as our most popular service.",
          pricing: [
            { size: "Small", weight: "1-9 KG", price: "750" },
            { size: "Medium", weight: "9-25 KG", price: "850" },
            { size: "Large", weight: "25-40 KG", price: "1000" },
            { size: "X-Large", weight: "40+ KG", price: "1500" },
            { size: "Cat", weight: <br></br>, price: "950" }
          ],
          additionalFee: "St.Roche Premium Products."
        },
        {
          name: "Special Care Package",
          image: "https://img.freepik.com/free-photo/haircuting-process-small-dog-sits-table-dog-with-professional_1157-48810.jpg?ga=GA1.1.175165772.1749993901&semt=ais_hybrid&w=740",
          description: "Luxury treatment for pets with special needs . Basic bath and dry, paw pad treatment.",
          pricing: [
            { size: "Small", weight: "1-9 KG", price: "550" },
            { size: "Medium", weight: "9-25 KG", price: "650" },
            { size: "Large", weight: "25-40 KG", price: "800" },
            { size: "X-Large", weight: "40+ KG", price: "1000" },
            { size: "Cat", weight: <br></br>, price: "700" }
          ],
          additionalFee: ""
        }
      ],
      features: [
        "Premium Products",
        "Gentle Handling",
        "Breed-Specific Cuts",
        "Comfort Breaks",
        "Fresh Scents",
        "Complimentary Styling"
      ],
      availableSlots: [10, 5, 5] // Slots for Basic, Premium, Special
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
       
      </section>

      {/* Booking Widget */}
      <Container className="booking-widget-container">
        <BookingWidget onServiceSelect={handleServiceSelect} selectedService={selectedService} />
      </Container>

      {/* Services Section */}
      <section className="services-section" id="services">
        <Container>
          <h2 className="section-title mb-4">Our Services</h2>
            <RoomTypeDropdown />
          <div className="services-container">

            {services.map(service => (
              <div key={service.id} className="service-item">
                {service.title.toLowerCase().includes('daycare') && (
                  <div className="text-center mb-2">
                    <DaycareImagesDropdown />
                  </div>
                )}
                {service.title.toLowerCase().includes('grooming') && (
                  <div className="text-center mb-2">
                    <GroomingImagesDropdown />
                  </div>
                )}
                
                <ServiceCard 
                  id={service.id}
                  title={service.title}
                  image={service.image}
                  pricing={service.pricing}
                  features={service.features}
                  description={service.description}
                  note={service.note}
                  availableSlots={service.availableSlots}
                  cardType={service.cardType}
                  options={service.options}
                  selectedService={selectedService}
                  bookingData={selectedService && selectedService.serviceId === service.id ? selectedService : null}
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* About Us Section */}
      <section className="about-section" id="about-us">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="section-title">About Us</h2>
            <div className="title-underline mx-auto"></div>
          </div>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="about-content">
                <h3 className="mb-3">About Baguio Pet Boarding <br></br>(Marsha's Pet Boarding)</h3>
                <p className="mb-3">
                Where love for pets inspired the creation of a haven for your furry friends.
                </p>
                <p className="mb-3">
                  Our story began with Mich and Marsha, her beloved dog. Her friends have recognized her special connection with pets, prompting them to entrust their beloved companions to her care, leading to the inception of a simple yet heartfelt pet boarding idea. At Baguio Pet Boarding, we aim to provide an environment where your pets not only stay but feel truly at home. We treat every pet as an extension of our own family, ensuring they receive the care, love, and attention they deserve. Cuddles and Playtime ahead! 
                </p>
                <p className="mb-3">
                Our team of lovable pet sitters—Mich, Ate Maan, Eloi, and Ralf. Mich, with her profound passion for animals, leads the pack, while Ate Maan, Eloi, and Ralf contribute their unique warmth and expertise. Together, they form a compassionate team committed to treating your pets with the same love and care as if they were their own. Rest assured, your cherished companions are in good hands with our devoted pet-sitting team.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <img
                src={require("../assets/bye.jpg")}
                alt="Pet Boarding Team"
                className="about-image rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Location Section */}
      <section className="location-section" id="location">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="section-title">Location</h2>
            <div className="title-underline mx-auto"></div>
          </div>
          <Row>
            <Col lg={8} className="mb-4 mb-lg-0">
              <div className="map-container" onClick={() => window.open('https://www.google.com/maps/place/Baguio+Pet+Boarding/@16.3905245,120.6008192,17z/data=!3m1!4b1!4m6!3m5!1s0x3391a1cd1f5bfe39:0xc3bbb853da5c7560!8m2!3d16.3905245!4d120.6008192!16s%2Fg%2F11rgdlbpqm?entry=ttu&g_ep=EgoyMDI1MDYwNC4wIKXMDSoASAFQAw%3D%3D', '_blank')} style={{ cursor: 'pointer' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3827.099349391249!2d120.59824531464814!3d16.390529588675782!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391a1cd1f5bfe39%3A0xc3bbb853da5c7560!2sBaguio%20Pet%20Boarding!5e0!3m2!1sen!2sph!4v1686176664417!5m2!1sen!2sph"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Baguio Pet Boarding Location"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="map-overlay d-flex align-items-center justify-content-center">
                  <Button variant="light" className="map-btn">
                    <MapPin size={18} className="me-2" /> Open in Google Maps
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={4}>
              <div className="info-card p-4 bg-white shadow rounded">
                <h3 className="mb-4 text-primary">Visit Us</h3>
                <div className="contact-item mb-3">
                  <div className="contact-icon">
                    <MapPin size={24} className="text-primary" />
                  </div>
                  <div className="contact-info">
                    <h5>Address</h5>
                    <p>186 Kenon Road, Camp 7, Baguio City, Philippines, 2600</p>
                  </div>
                </div>
                <div className="contact-item mb-3">
                  <div className="contact-icon">
                    <Phone size={24} className="text-primary" />
                  </div>
                  <div className="contact-info">
                    <h5>Phone</h5>
                    <p>+63 945 276 3087</p>
                  </div>
                </div>
                <div className="contact-item mb-3">
                  <div className="contact-icon">
                    <Mail size={24} className="text-primary" />
                  </div>
                  <div className="contact-info">
                    <h5>Email</h5>
                    <p>marshapetservices@gmail.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <Clock size={24} className="text-primary" />
                  </div>
                  <div className="contact-info">
                    <h5>Business Hours</h5>
                    <p>Monday - Sunday: 8:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomeNew;
