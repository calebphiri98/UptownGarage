-- Uptown Garage: Integrated Garage and Auto Parts Management System
-- PostgreSQL schema (designed for Neon)

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    make VARCHAR(80),
    model VARCHAR(80),
    year INTEGER,
    plate_number VARCHAR(30) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mechanics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Staff = Garage Administrator / Manager accounts (Section 11: role separation & approval logic).
-- Deliberately separate from `customers` — different actors, different powers.
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('administrator', 'manager')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    service_type VARCHAR(150) NOT NULL,
    requested_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Arrived, Converted, Cancelled, No-show
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    appointment_id INTEGER REFERENCES appointments(id),
    mechanic_id INTEGER REFERENCES mechanics(id),
    reported_problem TEXT NOT NULL,
    diagnosis TEXT,
    work_performed TEXT,
    completion_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Booked',
    -- Booked, Vehicle Checked In, Inspection, Awaiting Approval, Approved,
    -- In Progress, Waiting for Parts, Completed, Ready for Collection, Collected
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(60) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_parts (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    part_id INTEGER NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id),
    movement_type VARCHAR(20) NOT NULL, -- IN, JOB_USE, SALE, ADJUSTMENT
    quantity INTEGER NOT NULL,
    reference VARCHAR(60),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Rejected, Ready for Collection, Completed
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    part_id INTEGER NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    order_id INTEGER REFERENCES orders(id),
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid, Refunded, Cancelled
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(30),
    paid_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_role VARCHAR(30),
    action VARCHAR(150) NOT NULL,
    affected_table VARCHAR(60),
    affected_id INTEGER,
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
