-- Fix database script
-- This will create the bookings table with start_date and end_date columns

USE pet_hotel;

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pet_id INT NOT NULL,
  service_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  start_time TIME,
  end_time TIME,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  special_requests TEXT,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
  confirmed_by INT,
  confirmed_at TIMESTAMP NULL,
  cancelled_by INT,
  cancelled_at TIMESTAMP NULL,
  cancellation_reason TEXT,
  completed_at TIMESTAMP NULL,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add foreign keys if the related tables exist
-- These might fail if the referenced tables don't exist yet, which is fine
ALTER TABLE bookings
ADD CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(user_id),
ADD CONSTRAINT fk_booking_pet FOREIGN KEY (pet_id) REFERENCES pets(pet_id),
ADD CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(service_id);

-- Show the created table structure
DESCRIBE bookings;
