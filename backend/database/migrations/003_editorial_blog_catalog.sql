WITH duplicate_blogs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY title ORDER BY id ASC) AS duplicate_number
  FROM blogs
)
DELETE FROM blogs
WHERE id IN (
  SELECT id
  FROM duplicate_blogs
  WHERE duplicate_number > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blogs_title_unique'
  ) THEN
    ALTER TABLE blogs ADD CONSTRAINT blogs_title_unique UNIQUE (title);
  END IF;
END;
$$;

INSERT INTO blogs (title, content, author_username, category, image_url) VALUES
  (
    'Planning a Better First Mountain Weekend',
    'A good first mountain weekend is not about fitting the most activities into two days. Choose one approachable base town, one main outdoor objective, and one backup plan for poor weather.

Look for straightforward transport, a comfortable place to recover, and a route that still leaves time to enjoy the town. A flexible plan is often the difference between a rushed trip and one you will want to repeat.',
    NULL,
    'Planning',
    '/storage/mountain-photos/mountain_town_1.jpg'
  ),
  (
    'How to Choose a Mountain Town',
    'Start with the kind of day you actually want. Some mountain towns are built around lift access and winter sports, while others are better for trailheads, scenic drives, food, or slow afternoons after a hike.

Compare transport, elevation, season, nearby terrain, and what you can do if the weather turns. The best base is not always the most famous one. It is the place that gives your group useful options.',
    NULL,
    'Travel Guide',
    '/storage/mountain-photos/mountain_town_2.jpg'
  ),
  (
    'Safety Notes Before You Go Higher',
    'Mountain weather can change faster than expected. Check a local forecast, carry a warm layer, bring water, and tell someone where you plan to go before leaving town.

Treat summit plans as optional. Turning around early is a normal part of traveling in the mountains. Local guidance, posted closures, and current trail reports should always take priority over an old itinerary.',
    NULL,
    'Safety',
    '/storage/mountain-photos/mountain_town_3.jpg'
  ),
  (
    'A Quiet Guide to Alpine Hut Stays',
    'A mountain hut is simpler than a hotel and more social than a private cabin. Pack light, arrive with enough daylight to settle in, and check whether bedding, meals, drinking water, and payment methods are provided.

Hut etiquette matters. Keep shared spaces tidy, respect quiet hours, and prepare for limited charging and connectivity. The reward is a slower evening close to the route you came to explore.',
    NULL,
    'Experience',
    '/storage/mountain-photos/mountain_town_8.jpg'
  ),
  (
    'Reading Elevation Without Overthinking It',
    'Elevation is useful because it shapes temperature, weather, and how demanding a day may feel. It is not a score for whether a destination is worth visiting.

Use elevation as one planning signal among many. A lower valley town can be a better base if it has easy access to several routes, while a high pass may be beautiful but exposed and better suited to a short stop.',
    NULL,
    'Planning',
    '/storage/mountain-photos/mountain_town_10.jpg'
  ),
  (
    'What to Pack for a Changeable Mountain Day',
    'Pack for the conditions you may meet, not only the sunshine you see at breakfast. A light rain shell, an extra layer, water, snacks, and a charged phone cover the basics for many day trips.

The route still decides the final list. Remote hikes, snow travel, and technical terrain require local knowledge and more specialized equipment. Start simple, then add gear for the actual plan.',
    NULL,
    'Equipment',
    '/storage/mountain-photos/mountain_town_12.jpg'
  ),
  (
    'Why Scenic Mountain Passes Deserve a Slower Stop',
    'A mountain pass is often treated as a road between two destinations, but the crossing itself can be the memorable part of a trip. Pull over only at designated viewpoints, take time to read the landscape, and avoid rushing the descent.

Passes are exposed places. Wind, visibility, and road conditions can change quickly, so check local notices before setting out and keep a backup route in mind.',
    NULL,
    'Travel Guide',
    '/storage/mountain-photos/mountain_town_14.jpg'
  ),
  (
    'Building a Mountain Trip Without a Car',
    'A car is useful in some regions, but it is not always necessary. Rail-connected valleys, local buses, cable cars, and walkable trail towns can produce a calmer trip with fewer logistics.

Start by choosing the base town, then check the last connection of the day and the route from your accommodation to the trailhead. A slightly smaller destination with good transport can be more enjoyable than a famous place that requires constant driving.',
    NULL,
    'Tips',
    '/storage/mountain-photos/mountain_town_18.jpg'
  ),
  (
    'The Case for Keeping One Day Unplanned',
    'Leave one day open when you travel into the mountains. It gives you room to respond to weather, recover after a long walk, or follow a recommendation you only hear after arriving.

An open day is not wasted time. It is a practical buffer that makes the rest of the itinerary more resilient and gives the trip space to become its own story.',
    NULL,
    'Planning',
    '/storage/mountain-photos/mountain_town_21.jpg'
  ),
  (
    'Trail Town Mornings: Start Earlier, Rush Less',
    'An early start is not only about reaching a summit. It gives you quieter streets, cooler temperatures, more transport options, and extra time to change plans without stress.

Prepare the night before: refill water, check the local forecast, pack layers, and choose breakfast. The aim is not speed. It is to create enough margin for a good day outside.',
    NULL,
    'Tips',
    '/storage/mountain-photos/mountain_town_24.jpg'
  ),
  (
    'How to Use Reviews Without Letting Them Plan Your Trip',
    'Reviews are helpful when they reveal patterns: confusing transport, crowded weekends, seasonal closures, or a trailhead that is harder to reach than expected.

Do not treat one review as a complete guide. Conditions change, experience levels differ, and a traveler writing in winter may be describing a different destination from the one you will meet in summer.',
    NULL,
    'Travel Guide',
    '/storage/mountain-photos/mountain_town_28.jpg'
  ),
  (
    'A Better Recovery Day After a Long Hike',
    'A recovery day can still feel like part of the trip. Choose a gentle walk, a local cafe, a scenic train, or a short viewpoint instead of stacking another demanding route on tired legs.

This is especially useful on multi-day trips. A slower day protects the plans you care about later and lets you notice the character of the mountain town beyond its trailheads.',
    NULL,
    'Experience',
    '/storage/mountain-photos/mountain_town_32.jpg'
  )
ON CONFLICT (title) DO UPDATE SET
  content = EXCLUDED.content,
  author_username = EXCLUDED.author_username,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  updated_at = CURRENT_TIMESTAMP;
