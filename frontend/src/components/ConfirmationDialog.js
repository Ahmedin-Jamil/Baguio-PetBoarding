import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmationDialog = ({ show, onHide, onConfirm, title, message }) => {
  return (
    <Modal show={show} onHide={onHide} size="md" aria-labelledby="confirmation-dialog" centered>
      <Modal.Header closeButton style={{ backgroundColor: '#FFA500', color: 'white', padding: '1rem 0.5rem' }}>
        <Modal.Title id="confirmation-dialog">
          {title || 'Confirmation'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '0.5rem' }}>
        <p>{message || 'Are you sure you want to proceed?'}</p>
      </Modal.Body>
      <Modal.Footer style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '0.5rem' }}>
        <Button variant="secondary" onClick={onHide} style={{ minWidth: '800px' }}>
          No
        </Button>
        <Button variant="primary" onClick={onConfirm} style={{ minWidth: '800px' }}>
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationDialog;