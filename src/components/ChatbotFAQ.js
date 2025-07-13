import React, { useState } from 'react';
import { Card, Accordion, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaw, faCut, faHouse, faBowlFood, faCalendarCheck, faClock,
  faMoneyBill, faSyringe, faComments, faHeart, faBan, faShower
} from '@fortawesome/free-solid-svg-icons';

const ChatbotFAQ = ({ onQuestionClick }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAllServices, setShowAllServices] = useState(false);

  // FAQ categories matching pet_hotel.txt structure - only questions from knowledge base
  const faqCategories = [
    {
      id: 'about',
      title: '🏢 About Baguio Pet Boarding',
      icon: faHouse,
      color: '#4A6FDC',
      questions: [
        {
          icon: faPaw,
          question: 'What is Baguio Pet Boarding?',
          description: 'Learn about our pet hotel and services'
        },
        {
          icon: faHeart,
          question: 'Who are your pet sitters?',
          description: 'Meet our dedicated team of pet care professionals'
        },
        {
          icon: faHouse,
          question: 'Where are you located?',
          description: 'Our location in Baguio City'
        },
        {
          icon: faPaw,
          question: 'What pets do you accept?',
          description: 'Types of pets we welcome'
        }
      ]
    },
    {
      id: 'booking',
      title: '📅 Booking & Policies',
      icon: faCalendarCheck,
      color: '#E67E22',
      questions: [
        {
          icon: faCalendarCheck,
          question: 'How can I book a service?',
          description: 'Booking process through our website'
        },
        {
          icon: faBan,
          question: 'What is your cancellation policy?',
          description: '48-hour notice policy and fees'
        },
        {
          icon: faMoneyBill,
          question: 'How do I pay?',
          
        },
        {
          icon: faSyringe,
          question: 'Do you require any documents?',
          description: 'Required pet documentation and health information'
        }
      ]
    },
    {
      id: 'services',
      title: '🏠 Services & Features',
      icon: faPaw,
      color: '#27AE60',
      questions: [
        {
          icon: faHouse,
          question: 'What are your room options for pets?',
          description: 'Overview of Deluxe, Premium, and Executive Rooms'
        },
        {
          icon: faHouse,
          question: 'What\'s included in Deluxe rooms?',
          description: 'Features and amenities of Deluxe rooms'
        },
        {
          icon: faHouse,
          question: 'What\'s included in Premium rooms?',
          description: 'Features and amenities of Premium rooms'
        },
        {
          icon: faHouse,
          question: 'What\'s included in Executive rooms?',
          description: 'Features and amenities of Executive rooms'
        },
        {
          icon: faClock,
          question: 'Do you offer daycare?',
          description: 'Daycare services and supervision'
        },
        {
          icon: faShower,
          question: 'What grooming services do you offer?',
          description: 'Available grooming packages and services'
        }
      ]
    },
    {
      id: 'pricing',
      title: '💰 Pricing & Promotions',
      icon: faMoneyBill,
      color: '#8E44AD',
      questions: [
        {
          icon: faMoneyBill,
          question: 'How much do your services cost?',
          description: 'Pricing information and seasonal discounts'
        },
        {
          icon: faMoneyBill,
          question: 'Is there an extra fee for overnight stays?',
          description: 'Additional charges for overnight boarding'
        }
      ]
    },
    {
      id: 'other',
      title: 'ℹ️ Other Information',
      icon: faComments,
      color: '#2C3E50',
      questions: [
        {
          icon: faClock,
          question: 'Are you open 24/7?',
          
        },
        {
          icon: faComments,
          question: 'How can I review your services?',
          description: 'Where to leave feedback'
        },
        {
          icon: faHeart,
          question: 'Do you support animal welfare?',
          description: 'Our commitment to animal welfare'
        }
      ]
    },
    {
      id: 'outOfScope',
      title: '⚠️ Out-of-Scope Questions',
      icon: faBan,
      color: '#E74C3C',
      questions: [
        {
          icon: faBan,
          question: 'What if I ask about non-pet services?',
          description: 'Information about our service scope'
        }
      ]
    }
  ];

  const handleCategoryClick = (categoryId) => {
    // If showing all services and user clicks a category, close others and keep only this one open
    if (showAllServices) {
      setShowAllServices(false);
      setExpandedCategory(categoryId);
    } else {
      // Normal toggle behavior
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    }
  };

  const renderCategory = (category) => {
    const isExpanded = expandedCategory === category.id || showAllServices;
    return (
      <Card 
        key={category.id} 
        className="faq-category-card mb-2" 
        style={{ borderLeft: `4px solid ${category.color}` }}
      >
        <Card.Header 
          className="d-flex justify-content-between align-items-center py-2" 
          onClick={() => handleCategoryClick(category.id)}
          style={{ cursor: 'pointer', background: isExpanded ? `${category.color}15` : 'white' }}
        >
          <div className="d-flex align-items-center">
            <span className="category-icon me-2" style={{ color: category.color }}>
              <FontAwesomeIcon icon={category.icon} />
            </span>
            <span className="fw-bold">{category.title}</span>
          </div>
          <Badge bg="light" text="dark">{category.questions.length}</Badge>
        </Card.Header>
        
        {isExpanded && (
          <Card.Body className="py-1 px-2">
            {category.questions.map((question, idx) => (
              <div 
                key={idx} 
                className="faq-question-item p-2 mb-1" 
                style={{ 
                  borderRadius: '8px',
                  background: '#f8f9fa',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onQuestionClick(question.question)}
              >
                <div className="d-flex align-items-center">
                  <span className="me-1" style={{ color: category.color }}>
                    <FontAwesomeIcon icon={question.icon} size="sm" />
                  </span>
                  <div>
                    <div className="question-text fw-medium" style={{ fontSize: '0.9rem' }}>{question.question}</div>
                    <div className="question-description small text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>{question.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        )}
      </Card>
    );
  };

  return (
    <div className={`enhanced-faq-container p-1 ${showAllServices ? 'all-services-view' : ''}`}>
      <h5 className="text-center mb-1 fw-bold">📋 Helpful Information</h5>
      {showAllServices && (
        <div className="d-flex justify-content-end mb-2">
          <Button 
            variant="link" 
            size="sm" 
            className="text-muted p-0"
            onClick={() => setShowAllServices(false)}
          >
            Collapse All
          </Button>
        </div>
      )}
      {faqCategories.map(renderCategory)}
      
      <div className="text-center mt-1">
        <Button 
          variant="outline-secondary" 
          size="sm"
          className="py-1 px-2"
          style={{ fontSize: '0.8rem' }}
          onClick={() => {
            // Toggle showing all services
            setShowAllServices(true);
          }}
        >
          <FontAwesomeIcon icon={faPaw} className="me-1" size="xs" /> Browse all services
        </Button>
      </div>
    </div>
  );
};

export default ChatbotFAQ;