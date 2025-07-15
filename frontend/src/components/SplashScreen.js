import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import '../assets/logo192.png';
import './SplashScreen.css';

const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'missing_site_key';

const SplashScreen = ({ onFinished, displayTime = 5000 }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleCaptchaChange = async (value) => {
    if (value) {
      try {
        // Optional: Add API call to verify captcha on backend
        setVerified(true);
      } catch (error) {
        console.error('Verification error:', error);
        // Continue anyway since we're not doing backend verification yet
        setVerified(true);
      }
    }
  };

  useEffect(() => {
    if (!verified) return;
    
    // Start fade out immediately after verification
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 500); // Small delay for smooth transition

    // Call onFinished callback after fade animation
    const completeTimer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 1500); // 1.5s total transition time

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onFinished, verified]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <img 
            src={require('../assets/logo192.png')} 
            alt="Pet Boarding Logo" 
            className="splash-logo"
          />
        </div>
        <div className="welcome-text">
          <h1 className="welcome-title">Welcome to</h1>
          <h2 className="brand-name">Baguio Pet Boarding</h2>
          <p className="tagline">Your Pet's Extended Home</p>
        </div>
        {/* reCAPTCHA verification */}
        {!verified && (
          <div className="captcha-wrapper">
            <ReCAPTCHA sitekey={SITE_KEY} onChange={handleCaptchaChange} />
          </div>
        )}

        <div className="pet-animations">
          <div className="dog-animation"></div>
          <div className="cat-animation"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;