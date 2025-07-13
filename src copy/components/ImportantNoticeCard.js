import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import './ImportantNoticeCard.css';

const ImportantNoticeCard = ({ children }) => {
  return (
    <div className="important-notice-card">
      <p className="important-notice-text">
        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
        {children}
      </p>
    </div>
  );
};

export default ImportantNoticeCard;