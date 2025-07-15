import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import '../assets/logo192.png';
import './SplashScreen.css';

const SITE_KEY = '6LfPX00rAAAAAKPN3lU7gs9pQ25a-8QLsmgXziHr';

const SplashScreen = ({ onFinished, displayTime = 5000 }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleCaptchaChange = (value) => {
    if (value) {
      setVerified(true);
    }
  };

  useEffect(() => {
    if (!verified) return;
    // Start fade out animation after the specified display time (default: 3 seconds)
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, displayTime);

    // Call onFinished callback after fade out animation completes
    const completeTimer = setTimeout(() => {
      if (onFinished) onFinished();
    }, displayTime + 1000); // displayTime + 1s for fade out animation

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onFinished, displayTime, verified]);

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