var assert = require('assert');
var recipe_db = require("./database/database")
var request = require("request")

describe("cookbox_server tests", function() {
    var recipe;

    beforeEach(function() {
        recipe = JSON.parse("{\"id\":1,\"name\":\"Нежека \",\"short_description\":\"Нежный корж торта, вкусный с молоком \",\"long_description\":\"Нежный корж торта, вкусный с молоком \",\"target_quantity\":1,\"target_description\":\"One cake\",\"preparation_time\":0,\"source\":\"\",\"ingredient_list\":[{\"quantity\":200,\"description\":\"Мидилитров Молока \",\"other_recipe\":null},{\"quantity\":250,\"description\":\"Грам Муки\",\"other_recipe\":null},{\"quantity\":1,\"description\":\"Чайная ложка разрыхлитеья\",\"other_recipe\":null},{\"quantity\":200,\"description\":\"Грам Сахара \",\"other_recipe\":null},{\"quantity\":2,\"description\":\"Яйца \",\"other_recipe\":null},{\"quantity\":200,\"description\":\"Мидилитров сметаны \",\"other_recipe\":null}],\"instruction_list\":[\"Divide egg whites and yolk\",\"Beat the egg whites\",\"Add in the yolk \",\"Add the sugar and mix well \",\"Add сметану, careful not to mix too much\",\"Add flour mixed with the soda\",\"Mix until the mix is smooth \",\"Pour into a flat pie shape \",\"Bake for 40-45 minutes at 180° C \",\"\"],\"comment_list\":[\"You can make a few of these and make a cake, just make sure to beat the eggs really well, and pour it immediately after you're done mixing so that it commes out fluffy and will soak up the frosting\"],\"tag_list\":[]}")
    });

    describe("REST API", function() {
        it ("GET /recipe/:id", function() {
            request("http://localhost:3000/recipe/1", {json:true}, (err, response, body) => {
                if (err) throw err;
                assert(r === body, JSON.stringify(r) + "\n vs \n" + JSON.stringify(recipe));
            });
        });

        
    });
    describe("Database", function() {
        it("Read a recipe", function() {
            recipe_db.get(recipe.id, (err, r) => {
                if (err) { throw err; }
                assert(r === recipe, JSON.stringify(r) + "\n vs \n" + JSON.stringify(recipe));
            });
        });

        it("Write a new recipe", function() {
            var old_id = recipe.id;
            recipe.id = null;
            recipe.id = recipe_db.put(recipe, (err,id) => {
                if (err) throw err;
                return id;
            });

            assert(recipe.id != old_id);
        });
    });
});