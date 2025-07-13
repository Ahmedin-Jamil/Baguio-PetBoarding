import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './Agreement.css';
import baguioLogo from '../assets/logo192.png';


const Agreement = ({ show, onHide }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="agreement-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="agreement-modal" className="text-center w-100">
          <h4>Agreement</h4>
          <h5>Overnight & Daycare</h5>
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
          <h6 className="fw-bold">CHECK-IN CHECK-OUT FORM</h6>
          <p>Baguio Pet Boarding Pet Care Service WAIVER CONTRACT.</p>
          <p>Terms and Conditions DMC</p>
          
          <p>Signing our Pet Care Services Contract may apply to all your bookings today and in the future.</p>
          
          <h6 className="fw-bold mt-4">General Admission Policy:</h6>
          <ul>
            <li>The owner warrants that any known health and behavioral issue's concerning the pet have been fully disclosed prior to commencement of boarding, and that the pet is in sound health and mentally stable.</li>
            <li>Baguio Pet Boarding Services has the right to refuse entry to any animal without being required to give an explanation and condition of the pet/s.</li>
            <li>Aggressive animals will not be tolerated and we will require any animal that demonstrates aggressive behavior to be removed or separated.</li>
            <li>All pets present for boarding must be clean to the barn. Any pet's requiring bathing will be charged to their owner's account at the time of service.</li>
            <li>Any pet boarder at Baguio Pet Boarding may be photographed and photographs used for display and advertising purposes of our business.</li>
          </ul>
          
          <h6 className="fw-bold mt-4">Check-In/Pick-Up/Check-Out of Pet's:</h6>
          <ul>
            <li>For your pet's safety, all animals must remain on a leash or carrier whilst entering or exiting our premises.</li>
            <li>Please be informed that our check-in time begins at 9:00 AM onwards and early check-ins are subject to an additional fee. For check-out or pick-up, it is strictly at 12:00 noon. Any request for pick-up or check-out outside of these hours must be arranged in advance and may incur additional fees.</li>
            <li>If the pet is not collected within ten days of the nominated date of departure, and there is no communication from the owner to make suitable arrangements, the animal's shall be deemed abandoned and will be re-homed or disposed of at Baguio Pet Boarding Discretion.</li>
            <li>Boarding fees will be charged for each additional day the pet remains at our premises.</li>
            <li>Owner's written consent is required if another party is to collect animals on departure.</li>
          </ul>
          
          <h6 className="fw-bold mt-4">Payment</h6>
          <ul>
            <li>The Owner's agrees to pay at or prior collection of pets all costs and charges incurred during and relating to the pet's stay at Baguio Pet Boarding. These costs include boarding fees, veterinary expenses if special service is requested, and any other charges incurred.</li>
            <li>The owner agrees to pay the rate for boarding in effect on the date of admission, as per the price list above. Rates are subject to change without prior notice.</li>
            <li>Boarding rates are charged for each calendar day regardless of the time of admission or departure.</li>
            <li>The fully booked period will be charged during peak periods regardless of early departure. Peak bookings require a 50% deposit and booking fee is non-refundable/transferable.</li>
          </ul>
          
          <h6 className="fw-bold mt-4">Veterinary Insurance</h6>
          <ul>
            <li>Should your pet in the opinion of Baguio Pet Boarding services may require veterinary treatment while in our care, all such treatment will be at the owner's expense. Baguio Pet Boarding will reasonably attempt to contact the owner and/or emergency contact prior to seeking treatment except in case of emergency. If the owner cannot be contacted, exhausting all efforts, the team will immediately bring the pet to the hospital. Our nearest veterinary clinic will be visited ASAP. Transportation will also be charged and other expenses will be charged accordingly.</li>
          </ul>
          
          <h6 className="fw-bold mt-4">Vaccination and Parasite Control</h6>
          <ul>
            <li>All animals are expected to be a minimum (3) months old and fully vaccinated. Previously unvaccinated animals must have vaccinations completed within a minimum of 10 days before arrival.</li>
            <li>Animals must be free of internal parasites and fleas. Any affected animals can be treated by Baguio Pet Boarding with a charge shouldered by the owner.</li>
            <li>Due to the high incidence of paralysis ticks in our area, we strongly recommend an oral tick preventative to be given no less than 4 days prior to admission.</li>
          </ul>
          
          <h6 className="fw-bold mt-4">Responsibility Warranty and Indemnity</h6>
          <ul>
            <li>Under no circumstance will Baguio Pet Boarding or any of its staff and crew be held responsible for any paralysis, canine cough, sickness, death, loss, or damage of any kind that may be to any animal under care.</li>
            <li>Any damage in our facility (indoor/outdoor) will be charged to the owner's account and must be replaced immediately.</li>
          </ul>
          
          <p className="mt-4">I understand that this is a policy at Baguio Pet Boarding Services within the common areas. I understand that I am liable for any damage, or injury to any person or animal during the stay. I acknowledge that signing this contract creates a lien in favor of Baguio Pet Boarding Services over the animal(s) that I board at Baguio Pet Boarding until this agreement is rescinded in favor of a newer agreement.</p>
          
          <p>I acknowledge that I have read, understood, and agreed to all of the conditions and terms stated in this agreement.</p>
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

export default Agreement;