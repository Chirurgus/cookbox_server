# cookbox_server
REST API server for cookbox recipes

# Setup
1) setup nodejs and npm, run
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
2) install build tools, g++ make etc, run
sudo apt-get install -y build-essential
3) install express npm package, run
npm install express --save
3) install sqlite3 npm package, run
npm install sqlite3 --save
4) install body-parser npm package, run
npm install body-parser --save
5) start server, run
nodejs cookbox.js

# API

GET  
/recipe  
-------/:id        GET recipe with id :id {id:...,name:...,....}  
-------/ids        GET a list of all recipe ids => {ids:[...]}  
-------/sync       GET a list of all recipe ids that were updated since the time in sync-token => {recipe_ids:[...], tag_ids:[...], token: "...", schema_version: "..."}  
-------/tag/:id    GET the tag with the id :id => {id:...,tag:...}  
-------/tag/ids    GET all tag ids => {ids:[...]}  
-------/schema/schema/:ver GET the recipe database schema for a given version => {schema: "..."}
-------/schema/migration/:ver GET the migration script TO the given database schema version => {migration: "..."}

PUT  
/recipe  
-------/           UPDATE an existing recipe, returns the recipe's new id => {id:...}  
-------/tag        UPDATE an existing tag, expects {id:...,tag:...}, returns the tag's new id => {id:...}

POST  
/recipe  
-------/           POST a new recipe, returns the recipe's new id => {id:...}  
-------/tag        POST a new tag, expects {id:...,tag:...}, returns the tag's new id => {id:...}

DELETE  
/recipe  
-------/:id        Mark for deletion the recipe with id :id  
-------/tag/:id    Mark for deletion the tag with id :id  

The sync-token is a time stamp that can be found in the time_modified field in recipe/tag tables. If the token provided is null then all recipes/tag ids will be returned. It is then up to the client to ask for all recipes/tags, tags first.

Recipes marked for deletion will be deleted 30 days after their modification date.

