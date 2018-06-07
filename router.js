
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', function (req, res) {
    res.status(200).send("got to /recipe/");
});
router.get('/:id', function (req, res) {
    res.status(200).send(JSON.stringify(recipe_db.read_recipe(req.params.id)));
});

module.exports = router;