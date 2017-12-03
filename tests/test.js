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

 /**
  * @dot-rule ClassA <- foop
  * @dot-rule ClassA -> boop
  */
