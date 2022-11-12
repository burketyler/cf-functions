import { isAsymmetricMatch } from "./src/matchers/is-asymmetric-match.js";

console.log(
  isAsymmetricMatch(
    { test: 1, not: [true, true] },
    { test: 1, not: [true, true], st: "hi", and: { one: 1 } }
  )
);
