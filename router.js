
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

router.get('/:adr', function (req, res) {
    if (req.params.adr == "sync") {
        var recipe_idPromise;
        var tag_idPromise;
        if (req.body.time) {
            var token = new Date(req.body.time);

            recipe_idPromise = recipe_db.recent_recipes(token);
            tag_idPromise = recipe_db.recent_tags(token);
        }
        else {
            recipe_idPromise = recipe_db.all_ids();
            tag_idPromise = recipe_db.all_tags();
        }
            
        Promise.all([
            recipe_idPromise,
            tag_idPromise
        ]).then((values) => {
            recipe_ids = values[0],
            tag_ids = values[1]

            res.status(200).send(JSON.stringify( {"recipe_ids": recipe_ids, "tag_ids": tag_ids} )); 
        }).catch((err) => { 
            res.status(500).send(err.message); 
        });
        return;
    }
    else if (req.params.adr == "ids") {
        recipe_db.all_ids()
            .then((ids) => res.status(200).send( {"ids": ids} )) 
            .catch((err) => res.status(500).send(err.message) );
    }
    else {
        recipe_db.get(req.params.adr)
            .then((recipe) => res.status(200).send(JSON.stringify(recipe)) )
            .catch((err) => res.status(500).send(err.message) );
    }
});
router.get('/tag/:adr', function (req, res) {
    if (req.params.adr == "ids") {
        recipe_db.all_tags()
            .then(() => res.status(200).send( {"ids": ids } ) )
            .catch((err) => res.status(err.message) );
    }
    else {
        recipe_db.tag(req.params.adr)
            .then((recipe) => res.status(200).send(JSON.stringify(recipe)) )
            .catch((err) => res.status(500).send(err.message) );
    }
});
router.put('', function (req, res) {
    recipe_db.put(req.body)
        .then((recipe) => res.status(200).send(JSON.stringify(recipe.id)) )
        .catch((err) => res.status(500).send(err.message) );
});
router.put('/tag', function (req, res) {
    recipe_db.put(req.body)
        .then(() => res.status(200).send(JSON.stringify(tag.id)))
        .catch((err) => res.status(500).send(err.message) );
});



async function test(callback) {
    callback();
}

async function f(req,res) {
    await test(req.params.test).catch(err => {res.status(500).send(err.message);});
}

router.get('/test/:test', function (req,res) {
    var b = test(() => { return false; });
    if (b) {
        res.status(500).send("True");
    }
    else {
        res.status(500).send("False");
    }
});

module.exports = router;