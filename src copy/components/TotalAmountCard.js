import React from 'react';
import { Alert } from 'react-bootstrap';

/**
 * Simple reusable card to display the computed total amount for a reservation.
 * 
 * Props:
 *   amount (number) – already pre-formatted with commas if needed OR raw number
 *   currency (string) – currency symbol, defaults to "₱"
 */
const TotalAmountCard = ({ amount = 0, currency = '₱' }) => {
  const formatted = `${currency}${Number(amount).toLocaleString()}`;

  return (
    <div className="total-amount-card text-center mb-4">
      <h4>Total Amount</h4>
      <h3 style={{ fontWeight: 'bold', color: '#ff5722' }}>{formatted}</h3>
      <Alert variant="warning" className="py-2">
        This price is an estimate only. Final price may change after measuring your pet's weight in person.
      </Alert>
    </div>
  );
};

export default TotalAmountCard;
