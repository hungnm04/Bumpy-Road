-- Create the mountain database
CREATE DATABASE mountain;

CREATE TABLE users (
  username VARCHAR PRIMARY KEY,
  user_password VARCHAR,
  user_role BOOLEAN,
  email VARCHAR
);

--admin account

-- Generate random accounts
INSERT INTO users (username, user_password, user_role, email)
SELECT * FROM (
    SELECT 'admin' AS username, 
           'adminpassword' AS user_password, 
           'admin' AS user_role,
           CONCAT('admin_', SUBSTRING(MD5(RANDOM()::TEXT), 1, 8), '@example.com') AS email
    UNION ALL
    SELECT 'guest' || g.num AS username, 
           'guestpassword' AS user_password, 
           'guest' AS user_role,
           CONCAT('guest', g.num, '_', SUBSTRING(MD5(RANDOM()::TEXT), 1, 8), '@example.com') AS email
    FROM generate_series(1, 10) AS g(num)
) AS users_to_insert;


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

-- Create mountains table








