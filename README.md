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
