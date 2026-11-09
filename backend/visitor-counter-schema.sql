-- Dedicated to 7jabek-site. Do not reuse the Fazawjuh databases.
CREATE TABLE IF NOT EXISTS visitor_ids (
  id TEXT PRIMARY KEY NOT NULL,
  first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_counts (
  key TEXT PRIMARY KEY NOT NULL,
  total INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO site_counts (key, total) VALUES ('all', 0);
CREATE TRIGGER IF NOT EXISTS new_visitor AFTER INSERT ON visitor_ids
BEGIN
  UPDATE site_counts SET total = total + 1 WHERE key = 'all';
END;
