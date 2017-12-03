var glob = require("glob");
var fs = require("fs");
var path = require("path");

module.exports = function (src) {
    return new Promise(function (resolve) {

        var lines = [];
        var classes = {};
        var rules = {};
        var subgraphs = {};

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

                                    if (foundRules) {
                                        foundRules.forEach(function (rule) {

                                            var parts = rule.match(/\@dot-rule\s+([^\s]+)\s+([^\s]+)\s+([^\s\n]+)/);
                                            if (["->", "<-", "in", "eachIn"].indexOf(parts[2]) === -1) {
                                                console.error("Unsupported rule" + parts[0]);
                                            }
                                            if (parts[2] === "in" || parts[2] === "eachIn") {
                                                subgraphs[parts[3]] = subgraphs[parts[3]] || { nodes: [], types: [], styles: [] };
                                                if (parts[2] === "in") {
                                                    subgraphs[parts[3]].nodes.push(parts[1]);
                                                } else {
                                                    subgraphs[parts[3]].types.push(parts[1]);
                                                }
                                            } else {
                                                rules[parts[1]] = rules[parts[1]] || {};
                                                rules[parts[1]][parts[2]] = rules[parts[1]][parts[2]] || [];
                                                rules[parts[1]][parts[2]].push(parts[3]);
                                            }
                                        });
                                    }

                                    var foundClusters = comment.match(/\@dot-subgraph\s.+\n/g);

                                    if (foundClusters) {
                                        foundClusters.forEach(function (rule) {
                                            var parts = rule.match(/\@dot-subgraph\s+([^\s]+)\s+(.+)\n/);
                                            subgraphs[parts[1]] = subgraphs[parts[1]] || { nodes: [], types: [], styles: [] };
                                            subgraphs[parts[1]].styles.push(parts[2]);
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

                    var declarations = lines
                        .map(function (line) {

                            var types = line.match(/(\{([^\}]+)\})/g);

                            if (types) {
                                types.forEach(function (type) {
                                    var parts = type.match(/(\{([^\}]+)\})/);
                                    var replaceWith = classes[parts[2]] || '';
                                    line = line.replace(/(^\s+|\s+$)/g, '');
                                    line = (line.replace(parts[0], '').replace(/(^\s+|\s+$)/g, '') + " " + replaceWith).replace(/(^\s+|\s+$)/g, '');
                                    var name = line.match(/^([^\s]+)/)[1];
                                    Object.keys(subgraphs)
                                        .map(function (key) {
                                            return subgraphs[key];
                                        })
                                        .forEach(function (subgraph) {
                                            if (subgraph.types.indexOf(parts[2]) !== -1) {
                                                subgraph.nodes.push(name);
                                            }
                                        });
                                    if (rules[parts[2]]) {

                                        if (rules[parts[2]]['->']) {
                                            rules[parts[2]]['->'].forEach(function (arrow) {
                                                line += "\n" + name + " -> " + arrow;
                                            });
                                        }
                                        if (rules[parts[2]]['<-']) {
                                            rules[parts[2]]['<-'].forEach(function (arrow) {
                                                line += "\n" + arrow + " -> " + name;
                                            });
                                        }
                                        var name = line.match(/^([^\s]+)/)[1];
                                    }
                                });
                            }
                            return line;
                        })
                        .join("\n");

                    var sublines = Object.keys(subgraphs)
                        .map(function (key) {
                            return "subgraph cluster" + key + " { " + (subgraphs[key].styles.join("")) + " " + (subgraphs[key].nodes.join(" ")) + " }";
                        })
                        .join("\n");

                    resolve(
                        "digraph G {\ngraph [rankdir=LR, fontsize=10, margin=0.001];\n"
                        +
                        sublines + "\n" +
                        declarations
                        + "\n{ rank=\"max\";   e; }\n}\n"
                    );
                })

        });
    });
}
