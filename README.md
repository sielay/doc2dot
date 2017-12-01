# doc2dot
Generates dot (graphviz) document from code documentation comments like JSDoc, JavaDoc, PHPDoc

```bash
d2d './test/**/*.js'
d2d './test/**/*.js' > file.dot
```

```javascript
/**
 * @name abc
 * @param a
 * @param b
 * @dot tester -> noop
 * @dot {ClassA} tester
 * @dot-type ClassA [color=blue]
 */
function tester(a, b) {

}

/**
 * @dot {RelationB} noop -> tester 
 * @dot-type RelationB [shape=arrow]
 */

 // @dot noop -> boop
```

```dot
tester -> noop
tester [color=blue]
noop -> tester [shape=arrow]
noop -> boop
```

## Licence

MIT
