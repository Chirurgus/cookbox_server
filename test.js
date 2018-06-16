var assert = require('assert');
var recipe_db = require("./database/database")
var server = require("./cookbox.js")

let chai = require("chai");
let chai_http = require("chai-http")
let should = chai.should();

chai.use(chai_http);
   
function is_recipe(r) {
    r.should.be.an("object");
    r.should.have.property("id");
    r.should.have.property("name");
    r.should.have.property("short_description");
    r.should.have.property("long_description");
    r.should.have.property("target_quantity");
    r.should.have.property("target_description");
    r.should.have.property("preparation_time");
    r.should.have.property("ingredient_list");
    r.should.have.property("instruction_list");
    r.should.have.property("comment_list");
    r.should.have.property("tag_list");
    r.id.should.be.a("number");
    r.name.should.be.a("string");
    // etc
}

function is_tag(t) {
    t.should.be.an("object");
    t.should.have.property("tag");
    t.should.have.property("id");
}

describe("REST API", function() {
    var recipe;

    beforeEach(function() {
        recipe = JSON.parse("{\"id\":1,\"name\":\"Нежека \",\"short_description\":\"Нежный корж торта, вкусный с молоком \",\"long_description\":\"Нежный корж торта, вкусный с молоком \",\"target_quantity\":1,\"target_description\":\"One cake\",\"preparation_time\":0,\"source\":\"\",\"ingredient_list\":[{\"quantity\":200,\"description\":\"Мидилитров Молока \",\"other_recipe\":null},{\"quantity\":250,\"description\":\"Грам Муки\",\"other_recipe\":null},{\"quantity\":1,\"description\":\"Чайная ложка разрыхлитеья\",\"other_recipe\":null},{\"quantity\":200,\"description\":\"Грам Сахара \",\"other_recipe\":null},{\"quantity\":2,\"description\":\"Яйца \",\"other_recipe\":null},{\"quantity\":200,\"description\":\"Мидилитров сметаны \",\"other_recipe\":null}],\"instruction_list\":[\"Divide egg whites and yolk\",\"Beat the egg whites\",\"Add in the yolk \",\"Add the sugar and mix well \",\"Add сметану, careful not to mix too much\",\"Add flour mixed with the soda\",\"Mix until the mix is smooth \",\"Pour into a flat pie shape \",\"Bake for 40-45 minutes at 180° C \",\"\"],\"comment_list\":[\"You can make a few of these and make a cake, just make sure to beat the eggs really well, and pour it immediately after you're done mixing so that it commes out fluffy and will soak up the frosting\"],\"tag_list\":[]}")
    });

    it ("GET /recipe/:id", function(done) {
        chai.request(server)
            .get("/recipe/1")
            .end((err,res) => {
                if (err) throw err;
                res.should.have.status(200);
                is_recipe(res.body);
            });
        done();
    });
    
    it("GET /recipe/ids", function(done) {
        chai.request(server)
            .get("/recipe/ids")
            .end ((err,res) => {
                if (err) throw err;
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.ids.should.be.a("array");
            });
        done();
    })

    it("GET /tag/ids", function(done) {
        chai.request(server)
            .get("/recipe/tag/ids")
            .end((err,res) => {
                if (err) throw err;
                res.should.have.status(200);
                res.should.be.an("object");
                res.body.ids.sbould.be.a("array");
            });
        done();
    });

    it("GET /tag/:id", function(done) {
        chai.request(server)
            .get("/recipe/tag/1")
            .end((err,res) => {
                if (err) throw err;
                res.should.have.status(200);
                is_tag(res.body); 
            });
        done();
    });

    it("GET /sync", function(done) {
        chai.request(server)
            .get("/recipe/sync")
            .end((err,res) => {
                if (err) throw err;
                res.should.have.status(200);
                res.should.be.an("object");
                res.body.should.have.property("recipe_ids")
                res.body.should.have.property("tag_ids")
                res.body.recipe_ids.should.be.an("array");
                res.body.tag_ids.should.be.an("array");
            });
        done();
    });
});