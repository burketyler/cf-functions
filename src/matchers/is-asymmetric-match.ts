import { isDeepStrictEqual } from "util";

export function isAsymmetricMatch(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>
): boolean {
  return Object.keys(expected).reduce((eq, key) => {
    if (!hasProperty(actual, key) || !isEqual(expected[key], actual[key])) {
      eq = false;
    }

    return eq;
  }, true);
}

function hasProperty(obj: object | null, property: string): boolean {
  if (!obj) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(obj, property)) {
    return true;
  }

  return hasProperty(getPrototype(obj), property);
}

function getPrototype(obj: object) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(obj);
  }

  if (obj.constructor.prototype == obj) {
    return null;
  }

  return obj.constructor.prototype;
}

function isEqual(expected: unknown, actual: unknown): boolean {
  if (typeof expected !== typeof actual) {
    return false;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.reduce((eq, expectItem, index) => {
      if (!isEqual(expectItem, actual[index])) {
        eq = false;
      }
      return eq;
    }, true);
  }

  if (typeof expected === "object") {
    return isAsymmetricMatch(
      expected as Record<string, unknown>,
      actual as Record<string, unknown>
    );
  }

  return isDeepStrictEqual(expected, actual);
}
