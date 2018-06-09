
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

router.get('/:adr', function (req, res) {
    if (req.params.adr == "ids") {
        recipe_db.all_ids((err,ids) => {
            if (err) res.status(500);
            res.status(200).send(JSON.stringify(ids));
        });
    }
    else {
        recipe_db.get(req.params.adr, (err,recipe) => {
            if (err) res.status(500);
            res.status(200).send(JSON.stringify(recipe));
        });
    }
});
router.get('/tag/:adr', function (req, res) {
    if (req.params.adr == "ids") {
        recipe_db.all_tags((err,ids) => {
            if (err) res.status(500);
            res.status(200).send(JSON.stringify(ids));
        }); 
    }
    else {
        recipe_db.tag(req.params.adr, (err,recipe) => {
            if (err) res.status(500);
            res.status(200).send(JSON.stringify(recipe));
        });
    }
});
router.put('', function (req, res) {
    recipe_db.put(req.body, (err,recipe) => {
        if (err) res.status(500);
        res.status(200).send(JSON.stringify(recipe.id));
    });
});
router.put('/tag', function (req, res) {
    recipe_db.put(req.body, (err,tag) => {
        if (err) res.status(500);
        res.status(200).send(JSON.stringify(tag.id));
    });
});

module.exports = router;