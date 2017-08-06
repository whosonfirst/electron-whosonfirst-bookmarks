ALTER TABLE visits ADD feelings_id INTEGER;
UPDATE visits SET feelings_id = status_id;
