const sqlite3 = require('sqlite3').verbose();

const db_location = "database/recipe_v4.db";

class Recipe {
    constructor(id,
                name,
                short_description,
                long_description,
                target_quantity,
                target_description,
                preparation_time,
                source,
                ingredient_list,
                instruction_list,
                comment_list,
                tag_list) {
        this.id = id;
        this.name = name;
        this.short_description = short_description;
        this.long_description = long_description;
        this.target_quantity = target_quantity;
        this.target_description = target_description;
        this.preparation_time = preparation_time;
        this.source = source;
        this.ingredient_list = ingredient_list;
        this.instruction_list = instruction_list;
        this.comment_list = comment_list;
        this.tag_list = tag_list
    }
}

class Ingredient {
    constructor(quantity, description, other_recipe) {
        this.quantity = quantity;
        this.description = description;
        this.other_recipe = other_recipe;
    }
}

function open_db(db_location) {
    return new sqlite3.Database("database/recipe_v4.db", (err) => {
        if (err)
            console.error(err.mesage);
        else
            console.log("Opened db");
    });
}

function close_db(db) {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}

function read_ingredient_list(id, db) {
    let sql = 'SELECT * FROM ingredient_list WHERE recipe_id = ?';
    let params = [id];

    var ret = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach(row => {
           ret.push(new Ingredient(row.quantity, row.description, row.other_recipe)); 
        });
    });
    return ret;
}
function read_instruction_list(id, db) {
    let sql = 'SELECT * FROM instruction_list WHERE recipe_id = ?';
    let params = [id];

    var ret = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach(row => {
           ret.push(row.instruction); 
        });
    });
    return ret;
}
function read_comment_list(id, db) {
    let sql = 'SELECT * FROM comment_list WHERE recipe_id = ?';
    let params = [id];

    var ret = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach(row => {
           ret.push(row.comment); 
        });
    });
    return ret;
}

function read_tag_list(id, db) {
    let sql = 'SELECT * FROM tag_list WHERE recipe_id = ?';
    let params = [id];

    var ret = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach(row => {
           ret.push(row.tag_id); 
        });
    });
    return ret;
}

exports.get = function(id, callback) {
    db = open_db(db_location);
    let sql = 'SELECT * FROM recipe WHERE id = ?';
    let params = [id];

    var ingredient_list = read_ingredient_list(id, db);
    var instruction_list = read_instruction_list(id, db);
    var comment_list = read_comment_list(id,db);
    var tag_list = read_tag_list(id,db);
    db.get(sql, params, (err, row) => {
        if (err) {
            throw err;
        }
        var ret = new Recipe(row.id,
                           row.name,
                           row.short_description,
                           row.long_description,
                           row.target_quantity,
                           row.target_description,
                           row.preperation_time,
                           row.source,
                           ingredient_list,
                           instruction_list,
                           comment_list,
                           tag_list);
        callback(null, JSON.stringify(ret));
    });
   
}

exports.put = function(recipe, callback) {
    db = open_db(db_location);
    //Check tag is present
    var tag_ok = db.get("SELECT * from tag WHERE id = ?", [recipe.id], (err,row) => {
        if (err) {
            return console.error(err.messag);
        }
        row ? true : false ;
    });

    if (!tag_ok) {
        callback("Tag is not present.", recipe);
        return;
    }

    db.serialize(() => {
        db.run("BEGIN");

        if (!recipe.id) {
            db.run("INSERT INTO recipe(name,short_description,long_description,target_quantity,target_description,preperation_time,source) values(?,?,?,?,?,?,?)",
                    [recipe.name,recipe.short_description,recipe.long_description,recipe.target_quantity,recipe.target_description,recipe.preparation_time,recipe.source],
                    (err) => {
                        console.log("Inserted new recipe");
                        recipe.id = this.lastID;
                    }
            );
        }
        else {
            db.run("UPDATE OR ROLLBACK recipe SET name=?,short_description=?,long_description=?,target_quantity=?,target_description=?,preperation_time=?,source=? WHERE id=?",
                    [recipe.name,recipe.short_description,recipe.long_description,recipe.target_quantity,recipe.target_description,recipe.preparation_time,recipe.source,recipe.id],
                    (err) => { console.log("Updated recipe"); }
            );
        }

        db.run('DELETE FROM ingredient_list WHERE recipe_id = ?', [recipe.id]);
        recipe.ingredient_list.forEach(ing => {
            db.run("INSERT INTO ingredient_list(recipe_id,quantity,description,other_recipe) values(?,?,?,?)",
                   [recipe.id, ing.quantity, ing.description,ing.other_recipe]);
        });

        db.run('DELETE FROM instruction_list WHERE recipe_id = ?', [recipe.id]);
        for (var i = 0; i < recipe.instruction_list.length; ++i) {
            db.run("INSERT INTO instruction_list(recipe_id,position,instruction) values(?,?,?)",
                    [recipe.id, i, recipe.instruction_list[i]]);
        }

        db.run('DELETE FROM comment_list WHERE recipe_id = ?', [recipe.id]);
        recipe.comment_list.forEach(cmnt => {
            db.run("INSERT INTO comment_list(recipe_id,comment) values(?,?)",
                    [recipe.id, cmnt]);
        });

        db.run('DELETE FROM tag_list WHERE recipe_id = ?', [recipe.id]);
        recipe.comment_list.forEach(tag => {
            db.run("INSERT INTO tag_list(recipe_id,tag_id) values(?,?)",
                    [recipe.id, tag]);
        });

        db.run("COMMIT");

        close_db(db);
    });

    callback(null, recipe)
}

exports.all_ids = function(callback) {
    db = open_db(db_location);
    db.all("SELECT id FROM recipe", [], (err, rows) => {
        if (err) {
            throw err;
        }
        ids = [];
        rows.forEach(row => {
           ids.push(row.id); 
        });
        close_db(db);
        callback(null, ids);
    });
}

exports.tag = function(id, callback) {
    db = open_db(db_location);
    db.all("SELECT id FROM recipe", [], (err, rows) => {
        if (err) {
            throw err;
        }
        ids = [];
        rows.forEach(row => {
           ids.push(row.id); 
        });
        close_db(db);
        callback(null, ids);
    });
}