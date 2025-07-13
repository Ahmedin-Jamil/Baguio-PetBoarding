import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BookingProvider } from './context/BookingContext';

import { RoomAvailabilityProvider } from './context/RoomAvailabilityContext';
import { ServiceAvailabilityProvider } from './context/ServiceAvailabilityContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

// Import components
import NavigationBar from './components/Navbar';
import HomeNew from './components/HomeNew';
import Services from './components/Services';
// Booking component removed as requested
import GroomingServices from './components/GroomingServices';
import GroomingReservation from './components/GroomingReservation';
import OvernightReservation from './components/OvernightReservation';
import DaycareReservation from './components/DaycareReservation';
import Confirmation from './components/Confirmation';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

import BookingSearch from './components/BookingSearch';
import ChatFrame from './components/ChatFrame';
import ChatbotNew from './components/ChatbotNew';


import SplashScreen from './components/SplashScreen';


// Wrapper component to conditionally render the navbar
const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showFrameChat, setShowFrameChat] = useState(false);

  // Add event listener for messages from the chatbot iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'RETURN_TO_CHAT_FRAME') {
        setShowChatbot(false); // Hide the chatbot
        setShowFrameChat(true); // Show the chat frame
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="App">
      {!isAdminPage && <NavigationBar />}
      <BookingProvider>
        <RoomAvailabilityProvider>
          <ServiceAvailabilityProvider>
            <Routes>
              <Route path="/" element={<HomeNew />} />
              <Route path="/services" element={<Services />} />
              <Route path="/grooming-services" element={<GroomingServices />} />
              {/* Booking route removed as requested */}
              <Route path="/grooming-reservation" element={<GroomingReservation />} />
              <Route path="/overnight-reservation" element={<OvernightReservation />} />
              <Route path="/daycare-reservation" element={<DaycareReservation />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/search-booking" element={<BookingSearch />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              

            </Routes>
            
            {/* Help Button Section - Controls Frame Chat visibility */}
            <div className="help-section">
              {/* Help Button */}
              <button 
                className="help-btn rounded-circle btn btn-light"
                onClick={() => setShowFrameChat(!showFrameChat)}
                style={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  width: '50px',
                  height: '50px',
                  boxShadow: '0 30px 10px rgba(0,0,0,0.2)',
                  zIndex: 1000
                }}
              >
                <FontAwesomeIcon icon={faQuestion} />
              </button>
              
              {/* Frame Chat */}
              {showFrameChat && (
                <div className="frame-chat-popup" style={{
                  position: 'fixed',
                  bottom: '80px',
                  right: '20px',
                  zIndex: 1001
                }}>
                  <ChatFrame 
                    onAskQuestions={() => {
                      setShowFrameChat(false); // Close Frame Chat
                      setShowChatbot(true); // Open Chatbot
                    }}
                    onClose={() => setShowFrameChat(false)} 
                  />
                </div>
              )}

              {/* ChatbotNew component - visibility controlled by showChatbot state */}
              {showChatbot && (
                <div className="chatbot-popup" style={{
                  position: 'fixed',
                  bottom: '80px',
                  right: '20px',
                  zIndex: 1001
                }}>
                  <ChatbotNew onClose={() => setShowChatbot(false)} isOpen={showChatbot} />
                </div>
              )}
            </div>
          </ServiceAvailabilityProvider>
        </RoomAvailabilityProvider>
      </BookingProvider>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = () => {
    setShowSplash(false);
  };

  return (
    <AppProvider>
      <AuthProvider>
        <Router>
        {showSplash ? (
          <SplashScreen onFinished={handleSplashFinished} />
        ) : (
          <AppContent />
        )}
        </Router>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
