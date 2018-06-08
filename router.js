
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

router.get('/:id', function (req, res) {
    recipe_db.get(req.params.id, (err,recipe) => {
        res.status(200).send(JSON.stringify(recipe));
    });
});
router.put("", (req,res) => {
    recipe_db.put(req.body, (err,recipe) => {
        res.status(200);
    });
});

module.exports = router;