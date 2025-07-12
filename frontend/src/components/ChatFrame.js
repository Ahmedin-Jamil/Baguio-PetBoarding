import React from 'react';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faFacebookMessenger } from '@fortawesome/free-brands-svg-icons';
import './ChatFrame.css';
import baguioLogo from '../assets/logo192.png';

const ChatFrame = ({ onAskQuestions, onClose }) => {
  return (
    <div className="chat-frame">
      <div className="chat-header">
        <h4>FRAME CHAT</h4>
        <Button variant="link" className="close-btn" onClick={onClose}>
          &times;
        </Button>
      </div>
      
      <div className="chat-body text-center">
        <div className="chat-logo">
          <img src={baguioLogo} alt="Chat Logo" className="img-fluid" style={{ maxWidth: '100px' }} />
        </div>

        <p className="social-text" style={{ margin: '15px 0', color: '#4a4a4a', fontSize: '1rem', fontWeight: '500' }}>
          You can interact or message us through our social platforms
        </p>
        
        <div className="social-icons">
          <a href="https://www.facebook.com/BaguioPetBoardingPh" target="_blank" rel="noopener noreferrer" className="social-btn">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://www.instagram.com/baguiopetboarding/" target="_blank" rel="noopener noreferrer" className="social-btn">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="http://m.me/BaguioPetBoardingPh/" target="_blank" rel="noopener noreferrer" className="social-btn">
            <FontAwesomeIcon icon={faFacebookMessenger} />
          </a>
        </div>
        
        <div className="mt-4">
          <Button 
            className="ask-questions-btn" 
            onClick={onAskQuestions}
          >
            Ask Questions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatFrame;