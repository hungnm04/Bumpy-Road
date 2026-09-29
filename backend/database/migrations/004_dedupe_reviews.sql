WITH duplicate_reviews AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY mountain_id, username, rating, comment
      ORDER BY id ASC
    ) AS duplicate_number
  FROM reviews
)
DELETE FROM reviews
WHERE id IN (
  SELECT id
  FROM duplicate_reviews
  WHERE duplicate_number > 1
);
