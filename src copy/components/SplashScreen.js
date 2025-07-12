import React, { useState, useEffect } from 'react';
import '../assets/logo192.png';
import './SplashScreen.css';

const SplashScreen = ({ onFinished, displayTime = 5000 }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
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
  }, [onFinished, displayTime]);

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
        <div className="pet-animations">
          <div className="dog-animation"></div>
          <div className="cat-animation"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;