CREATE TABLE visits (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	latitude NUMERIC,
	longitude NUMERIC,
	wof_id INTEGER,
	neighbourhood_id INTEGER,
	macrohood_id INTEGER,
	locality_id INTEGER,
	metroarea_id INTEGER,			
	region_id INTEGER,
	country_id INTEGER,
	status_id INTEGER,
	date TEXT,
	name TEXT
);

CREATE INDEX `by_date` ON visits (`date`);
CREATE INDEX `by_neighbourhood` ON visits (`neighbourhood_id`);
CREATE INDEX `by_macrohood` ON visits (`macrohood_id`);
CREATE INDEX `by_locality` ON visits (`locality_id`, `neighbourhood_id`);
CREATE INDEX `by_metroarea` ON visits (`metroarea_id`);
CREATE INDEX `by_locality_macro` ON visits (`locality_id`, `macrohood_id`);
CREATE INDEX `by_region` ON visits (`region_id`);
CREATE INDEX `by_country` ON visits (`country_id`);

CREATE TABLE places (
	wof_id INTEGER PRIMARY KEY,
	body TEXT,
	created TEXT
);

CREATE TABLE tags (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tag TEXT
);

CREATE UNIQUE INDEX `by_tag` ON tags (`tag`);

CREATE TABLE places_tags (
	wof_id INTEGER,
	tag_id INTEGER
);

CREATE UNIQUE INDEX `by_tagid` ON places_tags (`wof_id`, `tag_id`);

CREATE TABLE trips (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	arrival TEXT,
	departure TEXT,
	wof_id INTEGER,
	status_id INTEGER,
	notes TEXT
);

CREATE INDEX `trips_by_date` ON trips (`arrival`, `departure`);
CREATE INDEX `trips_by_wofid` ON trips (`wof_id`);

CREATE TABLE lists (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	created TEXT
);

CREATE UNIQUE INDEX `by_list` ON `lists` (`name`);

CREATE TABLE list_items (
	list_id INTEGER,
	wof_id INTEGER,
	position INTEGER
);

CREATE UNIQUE INDEX `by_list_item` ON list_items (`list_id`, `wof_id`);
