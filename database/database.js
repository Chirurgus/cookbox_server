const sqlite3 = require('sqlite3').verbose();

const db_location = "database/recipe.db";
const schema_db_location = "database/schema.db"
const db_version = 7;

class Recipe {
    constructor(id,
                name,
                short_description,
                long_description,
                target_quantity,
                target_description,
                preparation_time,
                source,
                time_modified,
                deleted,
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
        this.time_modified = time_modified;
        this.deleted = deleted;
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
    constructor(id, tag, time_modified) {
        this.id = id;
        this.tag = tag;
        this.time_modified = time_modified;
    }
}

function time_token() {
    return JSON.stringify(new Date());
}

// Deprecated sine triggers in the database itself should handle it
async function touch_recipe(id, time) {
    return new Promise((resolve,reject) => {
        db.run("UPDATE recipe SET time_modified  = ? WHERE id = ?",
                [time, id],
                err => { reject(err); }
        );
        resolve();
    });
}

migrate_to_next_version = async function(next_version, schema_db, recipe_db) {
    return new Promise((resolve, reject) => {
        schema_db.get("SELECT migration FROM schema WHERE version = ?",[next_version], (err,row) => {
            if (err) {
                reject(new Error("Cannot read migration sql for version " + next_version + ":" + err));
            }
            console.log("exec row mig =>" + next_version);
            console.log(row.migration);
            recipe_db.exec(row.migration, err => {
                if (err) {
                    reject(new Error("Cannot migrate databse: " + err));
                }
                resolve();
            });
        });
    });
}

async function open_schema_db(path) {
    return new Promise((resolve,reject) => {
        var error = false;
        var schema_db = new sqlite3.Database(path, (err) => {
            if (err) {
                reject(err);
                error=true;
            }
        });
        if (!error) {
            resolve(schema_db);
        }
    });
}

async function upgrade_db(recipe_db, old_version) {
    return new Promise( async (resolve, reject) => {
        schema_db = await open_schema_db(schema_db_location);                

        if (old_version < 3) {
            reject(new Error("Cannot update db schema: database too old"));
            return;
        }

        recipe_db.serialize(async () => {
        schema_db.serialize(async () => {
       
        var error = false;
        recipe_db.exec("BEGIN", err => {
            if (err) {
                reject(new Error("Can't begin transaction: " + err));
                error=true;
            }
        });
        if (error) { return; }
        
        for (var next_version=old_version+1; next_version <= db_version; ++next_version) {
            try {
                await migrate_to_next_version(next_version, schema_db, recipe_db);
            }
            catch(err) {
                reject(err);
                return;
            }
        } 
        
        recipe_db.run("PRAGMA USER_VERSION = ?", [db_version], err => {
            if (err) {
                reject(new Error("Could not change USER_VERSION: " + err));
                error = true;
            }
        });
        if (error) return;

        recipe_db.exec("COMMIT", err => {
            if (err) {
                reject(new Error("Can't end transaction: " + err))
                error = true;
            }
        });
        if (error) return;

        console.log("Database upgraded to version " + db_version);        
        resolve();

        });
        });
    });
}

async function get_db_version_internal(db) {
    return new Promise((resolve, reject) => {
        db.get("PRAGMA USER_VERSION",[], async (err,res) => {
            if (err) {
                reject(err); 
                return;
            }
            resolve(res.USER_VERSION);
        });
    });

}

async function open_recipe_db(db_location, mode) {
    return new Promise (async (resolve,reject) => {
        var db = new sqlite3.Database(db_location, mode, (err) => {
            if (err) reject(err);
        });
        
        try {
            var version = await get_db_version_internal(db);

            if (version < db_version) {
                await upgrade_db(db, version);
            }
        }
        catch (err) {
            reject(err);
            return;
        }

        db.run("PRAGMA FOREIGN_KEYS=ON", (err) => {
            reject(err);
        });
        console.log("Opened db");
        resolve(db);
    });
}

function close_db(db) {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Database connection closed.");
    });
}

exports.recipe_in_db = async function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        
            let sql = 'SELECT count(*) AS idCount FROM recipe WHERE id = ?';
            let params = [id];

            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.idCount > 0);
            });
            close_db(db);
        }
        catch (err) {
            reject(err);
        }
    });
}

exports.tag_in_db = async function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        
            let sql = 'SELECT count(*) AS idCount FROM tag WHERE id = ?';
            let params = [id];

            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.idCount > 0);
            });
            close_db(db);
        }
        catch (err) {
            reject(err);
        }
    });
}

async function read_ingredient_list(id, db) {
    return new Promise( (resolve, reject) => {
        let sql = 'SELECT quantity,description,other_recipe FROM ingredient_list WHERE recipe_id = ?';
        let params = [id];

        var ret = [];
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            rows.forEach(row => {
                ret.push( new Ingredient(row.quantity, row.description, row.other_recipe)); 
            });

            resolve(ret);
        });
    });
}

async function read_instruction_list(id, db) {
    return new Promise ((resolve,reject) => {
        let sql = 'SELECT instruction FROM instruction_list WHERE recipe_id = ?';
        let params = [id];

        var ret = [];
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            rows.forEach(row => {
                ret.push(row.instruction); 
            });

            resolve(ret);
        });
    });
}

async function read_comment_list(id, db) {
    return new Promise ((resolve,reject) => {
        let sql = 'SELECT comment FROM comment_list WHERE recipe_id = ?';
        let params = [id];

        var ret = [];
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            rows.forEach(row => {
                ret.push(row.comment); 
            });

            resolve(ret);
        });
    });
}

async function read_tag_list(id, db) {
    return new Promise((resolve,reject)  => {
        let sql = 'SELECT * FROM tag_list WHERE recipe_id = ?';
        let params = [id];

        var ret = [];
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            rows.forEach(row => {
                ret.push(row.tag_id); 
            });

            resolve(ret);
        });
    });
}

exports.get_recipe = async function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        
            let sql = 'SELECT * FROM recipe WHERE id = ?';
            let params = [id];

            var ingredient_list = await read_ingredient_list(id,db);
            var instruction_list = await read_instruction_list(id,db);
            var comment_list = await read_comment_list(id,db);
            var tag_list = await read_tag_list(id,db);

            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (row == null) {
                    reject(new Error("Database does not conntain recipe with id " + id + "."))
                    return;
                }
                var ret = new Recipe(row.id,
                                row.name,
                                row.short_description,
                                row.long_description,
                                row.target_quantity,
                                row.target_description,
                                row.preparation_time,
                                row.source,
                                row.time_modified,
                                row.deleted,
                                ingredient_list,
                                instruction_list,
                                comment_list,
                                tag_list);
                close_db(db);
                resolve(ret);
            });
        }
        catch (err) {
            reject(err);
        }
    });
}

exports.put_recipe = async function(recipe) {
    return new Promise(async (resolve,reject) => { 
        db = await open_recipe_db(db_location,sqlite3.OPEN_READONLY);
        

        //Check tag is present
        let tag_ok = true;
        for (let i = 0; i <= recipe.tag_list.length; ++i) {
            db.get("SELECT * from tag WHERE id = ?", [recipe.tag_list[i]], (err,row) => {
                if (err) {
                    tag_ok = false;
                }
            });

            
        }

        if (!tag_ok) {
            reject(new Error("No tag with id: " + recipe.id))
            return; 
        }

        db.serialize(() => {
            db.run("BEGIN");
            
            if (!recipe.id) {
                db.run("INSERT INTO recipe(name,short_description,long_description,target_quantity,target_description,preparation_time,source) values(?,?,?,?,?,?,?)",
                        [recipe.name,recipe.short_description,recipe.long_description,recipe.target_quantity,recipe.target_description,recipe.preparation_time,recipe.source],
                        (err) => {
                            if (err) reject(err);
                            recipe.id = this.lastID;
                        }
                );
            }
            else {
                db.run("UPDATE OR ROLLBACK recipe SET name=?,short_description=?,long_description=?,target_quantity=?,target_description=?,preparation_time=?,source=? WHERE id=?",
                        [recipe.name,recipe.short_description,recipe.long_description,recipe.target_quantity,recipe.target_description,recipe.preparation_time,recipe.source,recipe.id],
                        reject
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

        resolve(recipe);
    });
}

exports.all_ids = async function() {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location, sqlite3.OPEN_READONLY);
        db.all("SELECT id FROM recipe", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            ids = [];
            rows.forEach(row => {
                ids.push(row.id); 
            });
            resolve(ids);
            close_db(db);
        });
    });
}

exports.all_tags = async function() {
    return new Promise(async (resolve,reject) => {
        db = await open_recipe_db(db_location, sqlite3.OPEN_READONLY);
        db.all("SELECT id FROM tag", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            ids = [];
            rows.forEach(row => {
                ids.push(row.id); 
            });
            resolve(ids);
            close_db(db);
        });
    });
}

exports.get_tag = async function(id) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location, sqlite3.OPEN_READONLY);
        db.get("SELECT * FROM tag WHERE id = ?", [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (row == null) {
                reject(new Error("There are no tags with id " + id + "."));
                return;
            }
            close_db(db);
            tag = new Tag(row.id, row.tag, row.time_modified);
            resolve(tag);
        });
    });
}

exports.put_tag = async function(tag) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        db.serialize(() => {
            db.run("BEGIN");
            if (tag.id) {
                db.run("UPDATE tag SET tag = ? where id = ?",[tag.tag, tag.id],reject);
            }
            else {
                db.run("INSERT INTO tag(tag) values(?)",[tag.tag],err => {
                    if (err) reject(err);
                    tag.id = this.lastID;
                });
            }
            db.run("COMMIT");
        });
    });
}

exports.recent_recipes = async function(time) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location,sqlite3.OPEN_READONLY);
        db.all("SELECT id FROM recipe WHERE time_modified > ?", [time], (err,rows) => {
            if (err) {
                reject(err); 
                return;
            }

            var ret = [];
            rows.forEach(row => {
                ret.push(row.id); 
            });
            resolve(ret);
            close_db(db);
        });
    });
}

exports.recent_tags = async function(time) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location,sqlite3.OPEN_READONLY);
        db.all("SELECT id FROM tag WHERE time_modified > ?", [time], (err,rows) => {
            if (err) {
                reject(err);
                return;
            }

            var ret = [];
            rows.forEach(row => {
                ret.push(row.id); 
            });
            resolve(ret);
            close_db(db);
        });
    });
}

exports.delete_recipe = async function(id) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location, sqlite3.OPEN_READWRITE);
        db.serialize(() => {
            db.run("BEGIN");
            db.run("DELETE FROM recipe WHERE id = ?",[id],reject);
            db.run("COMMIT");
        });
        close_db(db);
        resolve();
    });
}

exports.delete_tag = async function(tag_id) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location, sqlite3.OPEN_READWRITE);
        db.serialize(() => {
            db.run("BEGIN");
            db.run("DELETE FROM tag WHERE id = ?",[tag_id],reject);
            db.run("COMMIT");
        });
        close_db(db);
        resolve();
    });
}

exports.mark_delete_recipe = async function(id) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        db.run("UPDATE recipe SET deleted = \"true\" WHERE id = ?", [id], err => {
            if (err) {
                reject(err);
                return;
            }
        });
        close_db(db);
        resolve();
    });
}

exports.mark_delete_tag = async function(id) {
    return new Promise( async (resolve,reject) => {
        db = await open_recipe_db(db_location,sqlite3.OPEN_READWRITE);
        db.serialize(() => {
            db.run("UPDATE tag SET deleted = \"true\" WHERE id = ?", [id], err => {
                if (err) {
                    reject(err);
                    return;
                }
            });
        });
        close_db(db);
        resolve();
    });
}


exports.get_db_version = function() {
    return db_version
}

exports.get_schema = async function(version) {
    return new Promise(async (resolve,reject) => {
        schema_db = await open_schema_db(schema_db_location);
        schema_db.get("SELECT schema from schema where version = ?",[version],(err,row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row.schema);
        });
    });
}

exports.get_schema = async function(version) {
    return new Promise(async (resolve,reject) => {
        schema_db = await open_schema_db(schema_db_location);
        schema_db.get("SELECT schema from schema where version = ?",[version],(err,row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row.schema);
        });
    });
}

exports.get_migration = async function(version) {
    return new Promise(async (resolve,reject) => {
        schema_db = await open_schema_db(schema_db_location);
        schema_db.get("SELECT migration from schema where version = ?",[version],(err,row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row.migration);
        });
    });
}