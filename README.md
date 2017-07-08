# electron-whosonfirst-bookmarks

Bookmarks for Who's On First places.

## Important

Too soon. Move along.

## Install

First of all you will need to have [Git](https://git-scm.com/), [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed. On a Mac these are all easy to install with the [Homebrew](https://brew.sh/) package manager. On Linux all the dependencies are available via tools like `apt` or `yum`. On Windows I'm afraid I have no idea what the state of the art is these days.

Once all the dependencies are installed:

```
# Clone this repository
git clone https://github.com/whosonfirst/electron-whosonfirst-bookmarks

# Go into the repository
cd electron-whosonfirst-bookmarks

# Install dependencies
npm install

# Run the app
npm start
```

## Database schema

_This will change. Be prepared..._

```
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
			name TEXT);

CREATE TABLE places (wof_id INTEGER PRIMARY KEY, body TEXT,	created TEXT);

CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag TEXT);

CREATE TABLE places_tags (wof_id INTEGER, tag_id INTEGER);

CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, arrival TEXT, departure TEXT, wof_id INTEGER, status_id INTEGER, notes TEXT);
CREATE INDEX `trips_by_date` ON trips (`arrival`, `departure`);
CREATE INDEX `trips_by_wofid` ON trips (`wof_id`);

CREATE INDEX `by_date` ON visits (`date`);
CREATE INDEX `by_locality` ON visits (`locality_id`, `neighbourhood_id`);
CREATE INDEX `by_neighbourhood` ON visits (`neighbourhood_id`);

CREATE INDEX `by_macrohood` ON VISITS (`macrohood_id`);
CREATE INDEX `by_metroarea` ON VISITS (`metroarea_id`);
CREATE INDEX `by_locality_macro` ON VISITS (`locality_id`, `macrohood_id`);

CREATE UNIQUE INDEX `by_tag` ON tags (`tag`);
CREATE UNIQUE INDEX `by_tagid` ON places_tags (`wof_id`, `tag_id`);

CREATE TABLE list_items (list_id INTEGER, wof_id INTEGER, order INTEGER);
CREATE TABLE list_items (list_id INTEGER, wof_id INTEGER, idx INTEGER);
CREATE UNIQUE INDEX `by_list` ON `lists` (`name`);
CREATE UNIQUE INDEX `by_list_item` ON list_items (`list_id`, `wof_id`);
```

## See also

* https://electron.atom.io/
* https://www.npmjs.com/package/sqlite3
* https://github.com/mapbox/node-sqlite3/wiki/API
* https://stackoverflow.com/questions/32504307/how-to-use-sqlite3-module-with-electron
* https://github.com/zhm/node-spatialite
* http://fileformats.archiveteam.org/wiki/Firefox_bookmarks
