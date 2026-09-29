INSERT INTO users (
  username,
  user_password,
  user_role,
  email,
  first_name,
  last_name,
  bio,
  avatar_url
) VALUES
  (
    'admin',
    '$2a$12$PzgMyhuMgxpKkcRkeaRUme.X2bCzMJulZJB6v75I9zYx954u7WxGu',
    'admin',
    'admin@example.com',
    'Bumpy',
    'Admin',
    'Local admin account for Bumpy Road MVP testing.',
    '/storage/avatars/default-avatar.png'
  ),
  (
    'guest',
    '$2a$12$7NBdAKdSkpNcBgTGskxFIuL1KV1r2blvbiAImGsvkk/sjoFYFznfi',
    'guest',
    'guest@example.com',
    'Trail',
    'Guest',
    'Local guest account for route and review testing.',
    '/storage/avatars/default-avatar.png'
  )
ON CONFLICT (username) DO NOTHING;

UPDATE blogs
SET author_username = 'admin'
WHERE author_username IS NULL;

INSERT INTO mountains (id, name, location, description, photo_url, continent) VALUES
  (1, 'Zermatt', 'Switzerland', 'A picturesque mountain town at the base of the Matterhorn with glacier views, rail access, and classic alpine routes.', '/storage/mountain-photos/mountain_town_1.jpg', 'Europe'),
  (2, 'Banff', 'Canada', 'A rugged Rockies basecamp surrounded by turquoise lakes, high passes, and year-round mountain culture.', '/storage/mountain-photos/mountain_town_2.jpg', 'North America'),
  (3, 'Chamonix', 'France', 'A legendary Mont Blanc valley town built for climbers, skiers, and high-altitude trail days.', '/storage/mountain-photos/mountain_town_3.jpg', 'Europe'),
  (4, 'Sapa', 'Vietnam', 'A misty northern Vietnam mountain escape with terraced valleys, village trails, and Fansipan access.', '/storage/mountain-photos/mountain_town_36.jpg', 'Asia'),
  (5, 'Queenstown', 'New Zealand', 'A dramatic lake-and-peak adventure hub with alpine hikes, snowfields, and fast access to wild terrain.', '/storage/mountain-photos/mountain_town_5.jpg', 'Oceania')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  photo_url = EXCLUDED.photo_url,
  continent = EXCLUDED.continent;

SELECT setval('mountains_id_seq', GREATEST((SELECT MAX(id) FROM mountains), 1));

INSERT INTO reviews (mountain_id, username, rating, comment)
SELECT mountain_id, username, rating, comment
FROM (
  VALUES
    (1, 'guest', 5, 'Beautiful base town with easy access and unforgettable views.'),
    (2, 'guest', 4, 'Great for a first big mountain trip, especially with a flexible weather plan.'),
    (3, 'guest', 5, 'Feels like a real alpine launchpad from the moment you arrive.')
) AS seed_reviews(mountain_id, username, rating, comment)
WHERE NOT EXISTS (
  SELECT 1
  FROM reviews
  WHERE reviews.mountain_id = seed_reviews.mountain_id
    AND reviews.username = seed_reviews.username
    AND reviews.rating = seed_reviews.rating
    AND reviews.comment = seed_reviews.comment
);
