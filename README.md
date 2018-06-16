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
/recipes  
--------/:id        GET recipe with id :id {id:...,name:...,....}  
--------/ids        GET a list of all recipe ids => {ids:[...]}  
--------/sync       GET a list of all recipe ids that were updated since the time in sync-token => {recipe_ids:[...], tag_ids:[...]}  
--------/tag/:id    GET the tag with the id :id => {id:...,tag:...}  
--------/tag/ids    GET all tag ids => {ids:[...]}  

PUT  
/recipes  
--------/           PUT a new recipe, returns the recipe's new id => {id:...}  
--------/tag        PUT a new tag, returns the tag's new id => {id:...}  

The sync-token is a time stamp that can be found in the time_modified field in recipe/tag tables. If the token provided is null then all recipes/tag ids will be returned. It is then up to the client to ask for all recipes/tags, tags first.

