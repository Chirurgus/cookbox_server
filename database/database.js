const sqlite3 = require('sqlite3').verbose();

const db_location = "database/recipe.db";
const schema_db_location = "database/schema.db"
const db_version = 5;

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

class Tag {
    constructor(id, tag) {
        this.id = id;
        this.tag = tag;
    }
}

function upgrade_db(recipe_db, old_version) {
    return new Promise((resolve, reject) => {
        var schema_db = new sqlite3.Database(schema_db_location, (err) => {
            if (err)
                reject(err.message);
        });
        
        if (old_version < 3) {
            reject(new Error("Cannot update db schema: database too old"));
        }

        recipe_db.serialize(() => {
        schema_db.serialise(() => {

        for (var v = 4; v <= db_version; ++v) {
            if (old_version <= v) {
                schema_db.get("SELECT migration FROM schema WHERE version = ?",[v], (err,row) => {
                    if (err) reject(new Error("Cannot read migration sql for version " + v + ":" + err.message));
                    recipe_db.exec(row.migration, err => {
                        reject(new Error("Cannot migrate databse: " + err.message));
                    });
                });
                ++old_version;
            }   
        }

        });
        });
    });
}

function open_db(db_location) {
    return new Promise ((resolve,reject) => {
        var db = new sqlite3.Database(db_location, sqlite3.OPEN_READWRITE, (err) => {
            if (err)
                reject(err);
            else
                console.log("Opened db");
        });
        db.get("PRAGMA USER_VERSION",[], async (err,res) => {
            var version = res.USER_VERSION;
            if (version < db_version) {
                try {
                    await upgrade_db(db, version, db_version);
                    db.run("PRAGMA FOREIGN_KEYS=ON", (err) => {
                        reject(err);
                    });
                    resolve(db);
                }
                catch (err) {
                    reject(err);
                }
            }
        });
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

exports.get = async function(id, callback) {
    return new Promise(async (resolve, reject) => {
        try {
            db = await open_db(db_location);
        }
        catch (err) {
            throw err;
        }
    
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
                            row.preparation_time,
                            row.source,
                            ingredient_list,
                            instruction_list,
                            comment_list,
                            tag_list);
            close_db(db);
            resolve(ret);
        });
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
            db.run("INSERT INTO recipe(name,short_description,long_description,target_quantity,target_description,preparation_time,source) values(?,?,?,?,?,?,?)",
                    [recipe.name,recipe.short_description,recipe.long_description,recipe.target_quantity,recipe.target_description,recipe.preparation_time,recipe.source],
                    (err) => {
                        console.log("Inserted new recipe");
                        recipe.id = this.lastID;
                    }
            );
        }
        else {
            db.run("UPDATE OR ROLLBACK recipe SET name=?,short_description=?,long_description=?,target_quantity=?,target_description=?,preparation_time=?,source=? WHERE id=?",
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

exports.all_tags = function(callback) {
    db = open_db(db_location);
    db.all("SELECT id FROM tag", [], (err, rows) => {
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
    db.get("SELECT id,tag FROM tag WHERE id = ?", [id], (err, row) => {
        if (err) {
            throw err;
        }
        close_db(db);
        tag = new Tag(row.id, row.tag);
        callback(null, tag);
    });
}

exports.put_tag = function(tag, callback) {
    db = open_db(db_location);
    db.serialize(() => {
        db.run("BEGIN");
        if (tag.id) {
            db.run("UPDATE tag SET tag = ? where id = ?",[tag.tag, tag.id],err => {
                console.log("Updated tag");
            });
        }
        else {
            db.run("INSERT INTO tag(tag) values(?)",[tag.tag],err => {
                console.log("Inserted a new tag");
                tag.id = this.lastID;
            });
        }
        db.run("COMMIT");
    });
}

exports.recent_recipes = function(time, callback) {
    db = open_db(db_location);
    db.all("SELECT id FROM recipe WHERE time_modified > ?", [time], (err,rows) => {
        if (err) {
            throw err;
        }
        var ret = [];
        rows.forEach(row => {
           ret.push(row.id); 
        });
        close_db(db);
        callback(null, ret);
    });
}

exports.recent_tags = function(time, callback) {
    db = open_db(db_location);
    db.all("SELECT id FROM tag WHERE time_modified > ?", [time], (err,rows) => {
        if (err) {
            throw err;
        }
        var ret = [];
        rows.forEach(row => {
           ret.push(row.id); 
        });
        close_db(db);
        callback(null, ret);
    });
}