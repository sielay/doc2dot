#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const fs = require("fs");

const optionDefinitions = [
    { name: 'src', type: String, multiple: false, defaultOption: true },
    { name: 'dest', type: String, multiple: false },
];

const options = commandLineArgs(optionDefinitions, { partial: true });

if (options._unknown) {
    options.dest = options._unknown[0];
}

const result = require("./lib")(options.src);

if (!options.dest) {
    result.then(function (value) {
        console.log(value);
    });
    return;
}

result.then(function (value) {
    fs.writeFile(options.dest, value, 'utf8');
});

