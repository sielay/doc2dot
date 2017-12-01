var fs = require('fs');
var lib = require('../lib/lib');
var should = require('should');

describe("lib", () => {

    it("works", done => {

        fs.readFile("./tests/test.dot", "utf8", (err, dot) => {
            if (err) {
                done(err);
                return;
            }
            lib("./tests/test.js")
                .then(value => {
                    should(value).be.eql(dot);
                    done();
                })
                .catch(err => done(err));
        });

    });

});
