
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

router.get('/:adr', function (req, res) {
    if (req.params.adr == "sync") {
        if (!req.body.time) {
            recipe_db.all_ids((err,recipes) => {
                recipe_db.all_tags((err,tags) => {
                    res.status(200).send(JSON.stringify( {"recipes": recipes, "tags": tags} ));
                }); 
            });
            return;
        }
        var token = new Date(req.body.time);
        var recipes = [];
        var tags = [];
        recipe_db.recent_recipes(token, (err,ids) => {
            ids.forEach(id => {
                recipe_db.get(id)
                    .then((recipe) => { recipes.push(recipe); })
                    .catch((err) => res.send(500).send("Could not read recipes"));
            });
            recipe_db.recent_tags(token, (err,ids) => {
                ids.forEach(id => {
                    recipe_db.tag(id,(err,tag) => {
                        tags.push(tag);
                    });
                });
            });
        });
        
        res.status(200).send(JSON.stringify( {"recipes": recipes, "tags": tags} ));;
    }
    else if (req.params.adr == "ids") {
        recipe_db.all_ids((err,ids) => {
            if (err) res.status(500);
            res.status(200).send(JSON.stringify(ids));
        });
    }
    else {
        recipe_db.get(req.params.adr)
            .then((recipe) => { res.status(200).send(JSON.stringify(recipe)); })
            .catch((err) => { res.status(500); });
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



async function test(code) {
    if (code == "test") {
        return 123;
    }
    else {
        throw new Error("This is an error");
    }
}

async function f(req,res) {
    await test(req.params.test).catch(err => {res.status(500).send(err.message);});
}

router.get('/test/:test', function (req,res) {
    f(req,res);
});

module.exports = router;