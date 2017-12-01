var glob = require("glob");
var fs = require("fs");

module.exports = function (src) {
    return new Promise(function (resolve) {

        var lines = [];
        var classes = {};

        glob(src, function (err, files) {
            if (err) {
                console.error(err);
                process.exit(-1);
                return;
            }

            Promise.all(files
                .map(function (fileName) {
                    return new Promise(function (resolve, reject) {
                        fs.readFile(fileName, "utf8", function (err, content) {
                            if (err) {
                                return reject(err);
                            }
                            var foundComments = content.match(/\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g);
                            if (foundComments) {
                                foundComments.forEach(function (comment) {
                                    var foundClasses = comment.match(/\@dot-class\s+([^\s]+)\s+(\[([^\]]+)])/g);
                                    if (foundClasses) {
                                        foundClasses.forEach(function (klass) {
                                            var parts = klass.match(/\@dot-class\s+([^\s]+)\s+(\[([^\]]+)])/);
                                            classes[parts[1]] = parts[2];
                                        });
                                    }
                                    var foundLines = comment.match(/\@dot\s+(.+)(\n|$)/g)
                                    if (foundLines) {
                                        lines = lines.concat(foundLines.map(function (line) {
                                            return line.replace(/^\@dot\s+/, '').replace(/[\n\r]+/g,'');
                                        }));
                                    }
                                });
                            }
                            resolve(1);
                        });
                    });
                }))
                .then(() => {                    
                    resolve(lines
                        .map(function(line) {
                            var vars = line.match(/(\$\{([^\}]+)\})/g);
                            if (vars) {
                                vars.forEach(function(variable) {
                                    var parts = variable.match(/(\$\{([^\}]+)\})/);
                                    var replaceWith = classes[parts[2]] || '';
                                    line = line.replace(parts[0], replaceWith);
                                });
                            }
                            return line;
                        })
                        .join("\n")
                    );
                })

        });
    });
}
