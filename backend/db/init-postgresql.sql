-- Initialize PostgreSQL database schema for Baguio Pet Boarding

-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
    guest_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    pet_id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(guest_id),
    pet_name VARCHAR(50) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(50),
    age INTEGER,
    weight DECIMAL(5,2),
    medical_conditions TEXT,
    vaccination_status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER, -- in minutes
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(guest_id),
    pet_id INTEGER REFERENCES pets(pet_id),
    reference_number VARCHAR(20) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    room_type VARCHAR(50),
    special_requests TEXT,
    admin_notes TEXT,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Guest information for non-registered guests
    owner_first_name VARCHAR(50),
    owner_last_name VARCHAR(50),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(20),
    owner_address TEXT,
    -- Pet information for non-registered pets
    pet_name VARCHAR(50),
    pet_species VARCHAR(50),
    pet_breed VARCHAR(50),
    pet_age INTEGER,
    pet_weight DECIMAL(5,2),
    pet_medical_conditions TEXT,
    pet_vaccination_status TEXT
);

-- Create booking_services junction table
CREATE TABLE IF NOT EXISTS booking_services (
    booking_id INTEGER REFERENCES bookings(booking_id),
    service_id INTEGER REFERENCES services(service_id),
    quantity INTEGER DEFAULT 1,
    price_at_time DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (booking_id, service_id)
);

-- Create calendar table for availability tracking
CREATE TABLE IF NOT EXISTS calendar (
    date DATE PRIMARY KEY,
    available_slots INTEGER NOT NULL DEFAULT 10,
    booked_slots INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id),
    guest_id INTEGER REFERENCES guests(guest_id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(10) NOT NULL, -- 'admin' or 'guest'
    recipient_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create migration_log table
CREATE TABLE IF NOT EXISTS migration_log (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps on bookings
CREATE TRIGGER update_bookings_timestamp
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Create function for generating booking reference numbers
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'BPB' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDD') || LPAD(NEW.booking_id::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for generating booking reference numbers
CREATE TRIGGER before_booking_insert
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_reference();

-- Create indexes for better query performance
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_pet_id ON bookings(pet_id);
CREATE INDEX idx_bookings_reference_number ON bookings(reference_number);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_pets_guest_id ON pets(guest_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_guest_id ON reviews(guest_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Insert default admin user (password needs to be changed on first login)
INSERT INTO admin (username, password, email)
VALUES ('admin', '$2b$10$K.0HwpsxQ6hfFKcRb9Oq0eJ0RlOnBnAGsHnJfAn.PNxGxU12ZK1Tm', 'admin@baguiopetboarding.com')
ON CONFLICT (username) DO NOTHING;

-- Create initial services
INSERT INTO services (name, description, price, duration, active)
VALUES 
    ('Basic Boarding', 'Standard pet boarding service with feeding and basic care', 500.00, 1440, true),
    ('Premium Boarding', 'Luxury boarding with extra attention and premium food', 800.00, 1440, true),
    ('Grooming - Basic', 'Basic grooming service including bath and brush', 300.00, 60, true),
    ('Grooming - Full', 'Full grooming service including bath, brush, and styling', 500.00, 120, true),
    ('Day Care', 'Daytime pet care service', 300.00, 720, true)
ON CONFLICT DO NOTHING;
