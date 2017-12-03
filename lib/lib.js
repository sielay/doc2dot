var glob = require("glob");
var fs = require("fs");
var path = require("path");

module.exports = function (src) {
    return new Promise(function (resolve) {

        var lines = [];
        var classes = {};
        var rules = {};

        glob(path.join(process.cwd(), src), function (err, files) {
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
                            var foundComments = content.match(/((\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/)|(\/\/(.+\n)))/g);

                            if (foundComments) {
                                
                                foundComments.forEach(function (comment) {
                                    
                                    var foundClasses = comment.match(/\@dot-type\s+([^\s]+)\s+(\[([^\]]+)])/g);
                                    if (foundClasses) {
                                        foundClasses.forEach(function (klass) {
                                            var parts = klass.match(/\@dot-type\s+([^\s]+)\s+(\[([^\]]+)])/);
                                            classes[parts[1]] = parts[2];
                                        });
                                    }
                                    var foundRules = comment.match(/\@dot-rule\s.+\n/g);
                                    
                                    if(foundRules) {
                                        foundRules.forEach(function(rule) {
                                            
                                            var parts = rule.match(/\@dot-rule\s+([^\s]+)\s+([^\s]+)\s+([^\s\n]+)/);
                                            if(["->", "<-"].indexOf(parts[2]) === -1) {
                                                console.error("Unsupported rule" + parts[0]);
                                            }
                                            rules[parts[1]] = rules[parts[1]] || {};
                                            rules[parts[1]][parts[2]] = rules[parts[1]][parts[2]] || [];
                                            rules[parts[1]][parts[2]].push(parts[3]);
                                        });
                                    }
                                    var foundLines = comment.match(/\@dot\s+(.+)(\n|$)/g)
                                    if (foundLines) {
                                        lines = lines.concat(foundLines.map(function (line) {
                                            return line.replace(/^\@dot\s+/, '').replace(/[\n\r]+/g, '');
                                        }));
                                    }
                                });
                            }
                            resolve(1);
                        });
                    });
                }))
                .then(() => {
                    resolve(
                        "digraph G {\ngraph [rankdir=LR, fontsize=10, margin=0.001];\n"
                        +
                        lines
                            .map(function (line) {

                                var types = line.match(/(\{([^\}]+)\})/g);

                                if (types) {
                                    types.forEach(function (type) {
                                        var parts = type.match(/(\{([^\}]+)\})/);
                                        var replaceWith = classes[parts[2]] || ''; 
                                        line = line.replace(/(^\s+|\s+$)/g, '');                                       
                                        line = (line.replace(parts[0], '').replace(/(^\s+|\s+$)/g, '') + " " + replaceWith).replace(/(^\s+|\s+$)/g, '');
                                        if (rules[parts[2]]) {
                                            var name = line.match(/^([^\s]+)/)[1];
                                            if (rules[parts[2]]['->']) {
                                                rules[parts[2]]['->'].forEach(function(arrow) {
                                                    line += "\n" + name + " -> " + arrow;
                                                });
                                            }
                                            if (rules[parts[2]]['<-']) {
                                                rules[parts[2]]['<-'].forEach(function(arrow) {
                                                    line += "\n" + arrow + " -> " + name;
                                                });
                                            }
                                        }
                                    });
                                }
                                return line;
                            })
                            .join("\n")
                        + "\n{ rank=\"max\";   e; }\n}\n"
                    );
                })

        });
    });
}
