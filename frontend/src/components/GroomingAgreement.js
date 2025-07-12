import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './Agreement.css';
import baguioLogo from '../assets/logo192.png';


const GroomingAgreement = ({ show, onHide }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="grooming-agreement-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="grooming-agreement-modal" className="text-center w-100">
          <h4>Agreement</h4>
          <h5>Grooming</h5>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <img 
            src={baguioLogo} 
            alt="Baguio Pet Boarding" 
            style={{ width: '80px', height: 'auto' }} 
            className="mb-3"
          />
        </div>

        <div className="agreement-content">
          <h6 className="fw-bold">CONSENT TO GROOM & General Liability Waiver</h6>
          <p>#186 Kennon Road, Camp 7, Baguio City FOREMANWORTH</p>
          <p className="fw-bold">BAGUIO PET BOARDING: MARSHA'S TUB GROOMING WAIVER FORM</p>
          
          <p>Baguio Pet Boarding cares about the safety and well-being of all pets. We want to assure you that we will make every effort to make your pet's grooming visit as pleasant as possible.</p>
          
          <ol>
            <li>If during an appointment it becomes apparent that your pet is not able to be groomed due to aggression/ behavior or any other issue, the customer will only be charged for what service/s has been partially performed. Minor injuries such as nicks from clippers, scissors, or toenail trimmings may result if your A pet does not respond to the groomer and does not remain still during these procedures.</li>
            
            <li>If your pet has any allergies or medical conditions (epilepsy, seizures, diabetes, arthritis, separation anxiety, asthma, etc. it is extremely important that you make the groomer aware of any medical and behavioral issues so that we can take the necessary steps to ensure your pet's utmost safety and comfort.</li>
            
            <li>Pet guardian/Customer assumes all liabilities, financial and otherwise, for the behavior and health of their pet in both of the professional groomer and self-wash areas. In consideration of the services rendered by Marsha's Tub, the customer waives any and all claims, actions, or demands of any nature, foreseen or unforeseen relating to the care, control, and health of the customer's pet arising during or after services performed by Marsha's Tub.</li>
            
            <li>Expressions of anal glands are done externally by Marsha's Tub groomers. If you find your pet to have persistent irritation of their rear end, we encourage you to speak with your personal veterinary doctors to seek help.</li>
            
            <li>Occasionally, grooming can separate a current, close a pre-existing skin condition. Such medical problems could arise during or after the grooming procedure. In the event of this situation, the pet shall not hold Marsha's Tub liable. Pet guardian/Customer shall not hold Marsha's Tub liable for any skin irritations that may result from grooming procedures or any stressful effects that the grooming may have on young, timid, or temperamental pets. We will give customers enough time to explain and discuss the necessary conditions of their pets to prevent this.</li>
            
            <li>Pet Guardian/Customer also shall not hold Marsha's Tub liable for any problems discovered on a badly matted or otherwise neglected coat or integument.</li>
            
            <li>Any pet at Baguio Pet Boarding: Marsha's Tub may be photographed and photographs used for display and advertising purposes of our business.</li>
          </ol>
          
          <p>Marsha's Tub holds a high standard to ensure that your pet is handled with respect, care, and love. We recognize and respect that all pets are living beings who have feelings and experience emotions. We value that you have entrusted us to provide our services to them.</p>
          
          <p className="fw-bold mt-4">**After reading the waiver form, kindly please fill up and sign the waiver's acknowledgment form to agree that you have understood all terms and conditions above.</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GroomingAgreement;