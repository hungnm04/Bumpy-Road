-- Drop and recreate the blogs table
DROP TABLE IF EXISTS blogs;

CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_username VARCHAR(50) NOT NULL REFERENCES users(username),
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add sample data with image URLs
INSERT INTO blogs (title, content, author_username, category, image_url) VALUES
('First Mountain Adventure', 'This is a sample blog post about mountain adventures...', 'admin', 'Adventure', 'mountain_1.jpg'),
('Safety Tips for Climbers', 'Important safety guidelines for mountain climbing...', 'admin', 'Safety', 'mountain_2.jpg'),
('Best Equipment Guide', 'Essential equipment for mountain climbing...', 'admin', 'Equipment', 'mountain_3.jpg');
