
var express = require('express');
var bodyParser = require('body-parser');
var recipe_db = require("./database/database")

var router = express.Router();
router.use(bodyParser.json());

function handleSync(token, req, res) {
    var recipe_idPromise;
    var tag_idPromise;
    if (token) {
        var time = new Date(req.body.time);

        recipe_idPromise = recipe_db.recent_recipes(time);
        tag_idPromise = recipe_db.recent_tags(time);
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
        db_version = recipe_db.get_db_version();

        res.status(200).send( {"recipe_ids": recipe_ids, "tag_ids": tag_ids, "db_version": db_version} ); 
    }).catch((err) => { 
        res.status(500).send(err.message); 
    });
    return;
}

router.get('/sync/:token', function (req, res) {
    handleSync(req.params.token,req,res);
});

router.get('/:adr', function (req, res) {
    if (req.params.adr == "sync") {
        handleSync(null, req, res);
    }
    else if (req.params.adr == "ids") {
        recipe_db.all_ids()
            .then((ids) => res.status(200).send( {"ids": ids} )) 
            .catch((err) => res.status(500).send(err.message) );
    }
    else {
        recipe_db.get_recipe(req.params.adr)
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
        recipe_db.get_tag(req.params.adr)
            .then((recipe) => res.status(200).send(JSON.stringify(recipe)) )
            .catch((err) => res.status(500).send(err.message) );
    }
});
router.get("/schema/schema/:ver", function(req,res) {
    recipe_db.get_schema(req.params.ver)
        .then( (schema) => res.status(200).send( {"schema": schema } ) )
        .catch( err => res.status(500).send(err.message) );
});
router.get("/schema/migration/:ver", function(req,res) {
    recipe_db.get_migration(req.params.ver)
        .then( migration => res.status(200).send( {"migration": migration } ) )
        .catch( err => res.status(500).send(err.message) );
});


router.post('', function (req, res) {
    recipe_db.put_recipe(req.body)
        .then((recipe) => res.status(200).send(JSON.stringify(recipe.id)) )
        .catch((err) => res.status(500).send(err.message) );
});


router.put('', function (req, res) {
    recipe_db.put_recipe(req.body)
        .then((recipe) => res.status(200).send(JSON.stringify(recipe.id)) )
        .catch((err) => res.status(500).send(err.message) );
});
router.put('/tag', function (req, res) {
    recipe_db.put_tag(req.body)
        .then(() => res.status(200).send(JSON.stringify(tag.id)))
        .catch((err) => res.status(500).send(err.message) );
});


router.delete("/:id", function(req,res) {
    recipe_db.mark_delete_recipe(req.params.id)
        .then(() => res.status(200) )
        .catch((err) => res.status(500).send(err.message) );
});
router.delete("/tag/:id", function(req,res) {
    recipe_db.mark_delete_tag(req.params.id)
        .then(() => res.status(200) )
        .catch((err) => res.status(500).send(err.message) );
});




async function test(callback) {
    callback();
}

async function f(req,res) {
    await test(req.params.test).catch(err => {res.status(500).send(err.message);});
}

router.get('/test/:test', function (req,res) {
    res.status(200).send(JSON.stringify(new Date()));
});

module.exports = router;