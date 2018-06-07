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
                comment_list) {
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

exports.read_recipe = function(id) {
    db = open_db(db_location);
    let sql = 'SELECT * FROM recipe WHERE id = ?';
    let params = [id];

    var ingredient_list = read_ingredient_list(id, db);
    var instruction_list = read_instruction_list(id, db);
    var comment_list = read_comment_list(id,db);
    var ret;
    db.get(sql, params, (err, row) => {
        if (err) {
            throw err;
        }
        ret = new Recipe(row.id,
                           row.name,
                           row.short_description,
                           row.long_description,
                           row.target_quantity,
                           row.target_description,
                           row.preparation_time,
                           row.source,
                           ingredient_list,
                           instruction_list,
                           comment_list);
        console.log("Got recipe with id " + id);
    });
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
    return ret;
}