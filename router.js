
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

router.get('/:id', function (req, res) {
    recipe_db.get(req.params.id, (err,recipe) => {
        if (err) res.status(500);
        res.status(200).send(JSON.stringify(recipe));
    });
});
router.get('', function (req, res) {
    recipe_db.all_ids((err,ids) => {
        if (err) res.status(500);
        res.status(200).send(JSON.stringify(ids));
    });
});
router.put("", (req,res) => {
    recipe_db.put(req.body, (err,recipe) => {
        if (err) res.status(500);
        res.status(200).send(JSON.stringify(recipe.id));
    });
});

module.exports = router;