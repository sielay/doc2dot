#!/usr/bin/env node
const fs = require("fs");

const result = require("./lib")(process.argv[2]);

result.then(function (value) {
    process.stdout.write(value);
});
