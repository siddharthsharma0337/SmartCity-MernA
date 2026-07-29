-- Core App Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'driver', 'citizen', 'maintenance')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    polygon_geojson JSONB,
    priority_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bins (
    id VARCHAR(50) PRIMARY KEY,
    bin_code VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    zone_id INTEGER REFERENCES zones(id),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    capacity_liters DECIMAL(10, 2),
    current_fill_pct INTEGER DEFAULT 0,
    battery_pct INTEGER DEFAULT 100,
    temperature_c DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'offline', 'full', 'warning', 'maintenance')),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry / History Schema

CREATE TABLE IF NOT EXISTS bin_readings (
    id SERIAL PRIMARY KEY,
    bin_id VARCHAR(50) REFERENCES bins(id),
    fill_pct INTEGER NOT NULL,
    battery_pct INTEGER NOT NULL,
    temperature_c DECIMAL(5, 2),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    source VARCHAR(50) CHECK (source IN ('iot', 'driver_app', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trucks (
    id VARCHAR(50) PRIMARY KEY,
    truck_code VARCHAR(100) UNIQUE NOT NULL,
    driver_id INTEGER REFERENCES users(id),
    capacity_bins INTEGER,
    capacity_kg DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'on_route', 'maintenance')),
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(50) PRIMARY KEY,
    route_code VARCHAR(100) UNIQUE NOT NULL,
    truck_id VARCHAR(50) REFERENCES trucks(id),
    zone_id INTEGER REFERENCES zones(id),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    total_stops INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS route_stops (
    id SERIAL PRIMARY KEY,
    route_id VARCHAR(50) REFERENCES routes(id),
    bin_id VARCHAR(50) REFERENCES bins(id),
    stop_order INTEGER NOT NULL,
    eta TIMESTAMP WITH TIME ZONE,
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'visited', 'skipped'))
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    created_by_user_id INTEGER REFERENCES users(id),
    bin_id VARCHAR(50) REFERENCES bins(id),
    type VARCHAR(50) CHECK (type IN ('overflow', 'offline', 'damage', 'complaint')),
    description TEXT,
    photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
    assigned_to_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    bin_id VARCHAR(50) REFERENCES bins(id),
    alert_type VARCHAR(50) CHECK (alert_type IN ('full', 'offline', 'low_battery', 'sensor_fault')),
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    alert_id INTEGER REFERENCES alerts(id),
    channel VARCHAR(50) CHECK (channel IN ('push', 'sms', 'email', 'inapp')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
