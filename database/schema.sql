-- database/schema.sql

-- 1. Enable PostGIS extension for spatial/radius queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Create the Libraries Table
CREATE TABLE IF NOT EXISTS libraries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    location GEOGRAPHY(POINT, 4326),
    calendar_url TEXT,
    calendar_type VARCHAR(50),
    scraper_config JSONB DEFAULT '{}'::jsonb
);

-- Create a spatial index for fast radius searches
CREATE INDEX IF NOT EXISTS libraries_location_idx ON libraries USING GIST (location);

-- 4. Create the Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    event_url TEXT,
    category_ids INTEGER[] DEFAULT '{}',
    
    -- Ensures the scraper doesn't insert duplicate events
    CONSTRAINT unique_library_event UNIQUE (library_id, title, start_time)
);

-- 5. Seed category data.
INSERT INTO categories (id, tag_name) VALUES 
    (1, 'Storytime'), (2, 'Crafts'), (3, 'Book Talks'), (4, 'Games'), 
    (5, 'History'), (6, 'Health'), (7, 'STEM'), (8, 'Teens'), 
    (9, 'Adults'), (10, 'Family'), (11, 'Children'), (12, 'Early Childhood'), 
    (13, 'Tech Help'), (14, 'Special Needs'), (15, 'Languages'), 
    (16, 'Music'), (17, 'Money')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Sample Library Data to pull event data from.
-- This provides one functional Assabet calendar and one functional LibCal calendar.
-- It also includes PostGIS coordinates (Longitude, Latitude) to test spatial queries out of the box.

INSERT INTO libraries (name, address, location, calendar_url, calendar_type, scraper_config) 
VALUES 
    (
        'Red Hook Public Library', 
        '7444 S Broadway, Red Hook, NY 12571', 
        -- ST_MakePoint requires (Longitude, Latitude)
        ST_SetSRID(ST_MakePoint(-73.8756, 41.9963), 4326), 
        'https://redhooklibrary.assabetinteractive.com/calendar/', 
        'assabet', 
        '{"platform": "assabet", "base_url": "https://redhooklibrary.assabetinteractive.com/calendar/"}'::jsonb
    ),
    (
        'Rosendale Library', 
        '264 Main St, Rosendale, NY 12472', 
        ST_SetSRID(ST_MakePoint(-74.0832, 41.8445), 4326), 
        'https://rosendalelibrary.libcal.com/', 
        'libcal', 
        '{"c": "20923", "iid": "6801", "platform": "libcal", "base_api_url": "https://rosendalelibrary.libcal.com"}'::jsonb
    );