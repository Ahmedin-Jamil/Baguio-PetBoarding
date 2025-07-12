-- Migration to add reference_number column to bookings table

-- Add reference_number column
ALTER TABLE bookings ADD COLUMN reference_number VARCHAR(20) UNIQUE;

-- Update existing bookings with reference numbers
UPDATE bookings SET reference_number = CONCAT('BPB', LPAD(booking_id, 4, '0'));

-- Create trigger to auto-generate reference numbers for new bookings
DELIMITER //

CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    SET NEW.reference_number = CONCAT('BPB', LPAD(LAST_INSERT_ID() + 1, 4, '0'));
END//

DELIMITER ;

-- Create migration log entry
INSERT INTO migration_log (migration_name, notes) 
VALUES ('add_reference_number', 'Added reference_number column and auto-generation trigger to bookings table');
