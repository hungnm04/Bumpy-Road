-- Create the mountain database
CREATE DATABASE mountain;

CREATE TABLE users (
  username VARCHAR PRIMARY KEY,
  user_password VARCHAR,
  user_role BOOLEAN,
  email VARCHAR
);


--Create faq table to connect with server
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- Reset counter id to 1 after deleting
ALTER SEQUENCE faqs_id_seq RESTART WITH 1;

-- insert data testing
INSERT INTO faqs (name, email, subject, message) VALUES 
('John Doe', 'john@example.com', 'Subject 1', 'Message 1'),
('Jane Doe', 'jane@example.com', 'Subject 2', 'Message 2');

-- Alter users table
ALTER TABLE users
ALTER COLUMN username TYPE VARCHAR(50),
ALTER COLUMN user_password TYPE VARCHAR(255),
ALTER COLUMN user_role TYPE VARCHAR(20),
ALTER COLUMN email TYPE VARCHAR(255),
ADD COLUMN first_name VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN last_name VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN profile_picture_url VARCHAR(255),
ADD COLUMN bio TEXT,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add unique constraint to email
ALTER TABLE users
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Create user_favorites table
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_username VARCHAR(50) NOT NULL REFERENCES users(username),
  mountain_id INTEGER NOT NULL REFERENCES mountains(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Update faqs table
ALTER TABLE faqs
ALTER COLUMN name TYPE VARCHAR(100),
ALTER COLUMN email TYPE VARCHAR(255),
ALTER COLUMN subject TYPE VARCHAR(255),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;



-- index
CREATE INDEX idx_posts_mountain_id ON posts(mountain_id);
CREATE INDEX idx_reviews_mountain_id ON reviews(mountain_id);
CREATE INDEX idx_user_favorites_user_username ON user_favorites(user_username);
CREATE INDEX idx_user_favorites_mountain_id ON user_favorites(mountain_id);

--review constraint 
ALTER TABLE reviews
ADD CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE users
ADD CONSTRAINT check_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$');

--full text search 
ALTER TABLE posts
ADD COLUMN search_vector tsvector;

CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);

CREATE TRIGGER posts_search_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);


--frequent queries
CREATE INDEX idx_mountains_name ON mountains(name);

--unique constraint
ALTER TABLE user_favorites
ADD CONSTRAINT unique_user_mountain UNIQUE (user_username, mountain_id);
