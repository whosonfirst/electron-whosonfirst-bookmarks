# electron-whosonfirst-bookmarks

Bookmarks for Who's On First places.

## Important

This is wetter-than-wet paint. If you don't have the time or the inclination for a lot of unknown-unknowns and a measure of bad craziness then it's probably still "too soon". If you're up for some adventure then welcome!

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

Take a look at [schema/main.sql](schema/main.sql).

### Important

It is very likely that the database schema _will change_ and it may change [without a handy facility](https://github.com/whosonfirst/electron-whosonfirst-bookmarks/blob/master/javascript/mapzen.whosonfirst.bookmarks.database.js#L63-L124) for updating itself automatically (yet). Any subsequent database alters will be included with the source code but you may have to apply them manually, at least in the short-term.

## See also

* https://electron.atom.io/
* https://www.npmjs.com/package/sqlite3
* https://github.com/mapbox/node-sqlite3/wiki/API
* https://stackoverflow.com/questions/32504307/how-to-use-sqlite3-module-with-electron
* https://github.com/zhm/node-spatialite
* http://fileformats.archiveteam.org/wiki/Firefox_bookmarks
