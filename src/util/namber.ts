/**
 * A set of functions to make working with the Namber type more convenient.  A Namber
 * represents a number that can optionally have a 'n/a' value and includes information
 * about the source/reason that the value is 'n/a'.
 *
 * This type and its manipulations share similarities with an Either<T> or Optional<T>
 * type from other languages, but is specialized for the data processing needs of CBB.
 */
import { round as dataUtilsRound, isNumberLike, toNumber } from './dataUtils';

/**
 * Namber is a NaN-able number
 *
 * In the error case, 'message' is meant to be a succinct, human-readable error message description
 * that is likely to be presented to the user via some UI.  The 'errors' array is a collection of
 * one or more unerlying issues that have led to the value becoming 'n/a'
 */
export type ValidNamber = { value: number; errors?: never; message?: never };
export type NANamber = { value: 'n/a'; errors: Array<string>; message: string };
export type Namber = ValidNamber | NANamber;

export type ValidatorResult = { hasErrors: boolean; errors: string[] };
export type UnaryValidator = (arg: Namber) => ValidatorResult;
export type BinaryValidator = (left: Namber, right: Namber) => ValidatorResult;

const NO_ERROR: ValidatorResult = { hasErrors: false, errors: [] };
export const naString = 'n/a';

/**
 * Allow several convenience ways to create a new Namber
 * Namber(1) returns a namber with value 1
 * Namber('n/a') returns a namber with value 'n/a' and empty error array and message
 * Namber('foo') returns a namber with value 'n/a', an empty error array, and message of 'foo'
 * Namber(errors, 'foo') returns a namber with value 'n/a' and populated the errors array and message
 *
 * @param errors
 * @param message
 */
export function Namber(errors: string[], message: string): Namber;
export function Namber(value: string): Namber;
export function Namber(value: number): Namber;
export function Namber(value: 'n/a' | number): Namber;
export function Namber(value: Namber): Namber;
export function Namber(value: Namber | number): Namber;
export function Namber(
  arg1: Namber | number | string | string[] | undefined,
  message?: string
): Namber;
export function Namber(
  arg1: Namber | number | string | string[] | undefined,
  message?: string
): Namber {
  if (typeof arg1 === 'number') {
    if (Number.isNaN(arg1)) {
      return Namber(['Number argument was NaN']);
    }

    return { value: arg1 };
  }

  if (typeof arg1 === 'string') {
    // Convert number-like strings to valid values
    if (isNumberLike(arg1)) {
      return { value: toNumber(arg1) };
    }

    if (arg1 === naString) {
      return { value: naString, errors: [], message: '' };
    }

    return { value: naString, errors: [], message: arg1 };
  }

  if (Array.isArray(arg1)) {
    return { value: naString, errors: arg1, message: message || '' };
  }

  if (typeof arg1 === 'undefined') {
    return {
      value: naString,
      errors: ['undefined value passed to Namber constructor'],
      message: message || '',
    };
  }

  // Argument is already a Namber
  return arg1;
}

/**
 * Type guard to check if a namber holds a number value
 *
 * @param namber input
 */
export function hasValue(namber: Namber): namber is ValidNamber {
  return typeof namber.value === 'number';
}

/**
 * Type guard to check if a namber holds an 'n/a' value
 *
 * @param namber input
 */
export function isNA(namber: Namber): namber is NANamber {
  return typeof namber.value === 'string' && namber.value === naString;
}

export function naNamber(message?: string): NANamber {
  return Namber(naString, message) as NANamber;
}

// A validators type contains individual validators for the left argument, right argument and pairs
export type Validators = {
  left?: UnaryValidator[];
  right?: UnaryValidator[];
  pair?: BinaryValidator[];
};

/**
 * A built-in validator that checks Namber arguments for basic validity. It is used in the
 * validate() function.
 *
 * Importantly, it ensures that all of the error messages are combined so that not history is lost
 * about *why* a namber was given an 'n/a' value.
 */
const argsValidator = (...args: Namber[]): ValidatorResult => {
  // Identify which arguments are 'n/a' values
  const badArgs = args.filter((arg) => arg.value === naString) as NANamber[];

  // Build up the return values.
  const hasErrors = badArgs.length > 0;
  const errors = badArgs.reduce((arr, arg) => [...arr, ...arg.errors], []);

  return { hasErrors, errors };
};

/**
 * Internal convience method for creating a validation ERROR object
 */
function ERR(message: string): ValidatorResult {
  return { hasErrors: true, errors: [message] };
}

/**
 * Internal function to create a validator for a single Namber argument.
 *
 * @param predicate Test function that takes a Namber and returns true if the value is OK
 * @param errorMessage The error message to attach to the validation with the predicate returns false
 */
function unaryFactory(
  predicate: (arg: Namber) => boolean,
  errorMessage: string
): UnaryValidator {
  return (_: Namber): ValidatorResult =>
    predicate(_) ? NO_ERROR : ERR(errorMessage);
}

/**
 * Internal function to create a validator for a pair of Namber arguments.
 *
 * @param predicate Test function that takes two Nambers and returns true if the values are OK
 * @param errorMessage The error message to attach to the validation with the predicate returns false
 */
function binaryFactory(
  predicate: (left: Namber, right: Namber) => boolean,
  errorMessage: string
): BinaryValidator {
  return (a: Namber, b: Namber): ValidatorResult =>
    predicate(a, b) ? NO_ERROR : ERR(errorMessage);
}

/**
 * Function to apply validators to a single argument
 *
 * @param a
 * @param b
 * @param validators
 */
function unaryValidate(
  arg: Namber,
  validators?: UnaryValidator[]
): ValidatorResult {
  const argValidation = argsValidator(arg);
  const validationResults: ValidatorResult[] = [];

  if (typeof validators !== 'undefined') {
    validationResults.push(...validators.map((validator) => validator(arg)));
  }

  // Concatenate all of the results together
  return validationResults.reduce(
    (results, result) => ({
      hasErrors: results.hasErrors || result.hasErrors,
      errors: [...results.errors, ...result.errors],
    }),
    argValidation
  );
}

/**
 * Function to apply validators to a pair of arguments
 *
 * @param a
 * @param b
 * @param validators
 */
function binaryValidate(
  a: Namber,
  b: Namber,
  validators?: Validators
): ValidatorResult {
  const argValidation = argsValidator(a, b);
  const validationResults: ValidatorResult[] = [];

  if (typeof validators !== 'undefined') {
    if (typeof validators.left !== 'undefined') {
      validationResults.push(
        ...validators.left.map((validator) => validator(a))
      );
    }
    if (typeof validators.right !== 'undefined') {
      validationResults.push(
        ...validators.right.map((validator) => validator(b))
      );
    }
    if (typeof validators.pair !== 'undefined') {
      validationResults.push(
        ...validators.pair.map((validator) => validator(a, b))
      );
    }
  }

  // Concatenate all of the results together
  return validationResults.reduce(
    (results, result) => ({
      hasErrors: results.hasErrors || result.hasErrors,
      errors: [...results.errors, ...result.errors],
    }),
    argValidation
  );
}

/**
 * Helper function to take two Nambers and apply a binary function if both inputs are
 * valid.  The return value will include all the 'errors' from both types (if defined)
 *
 * @param a input of unary function.
 * @param func the underlying function to apply
 * @param validators an optional collection of validators
 */
function unaryFunc(
  a: Namber,
  func: (arg: number) => number,
  errorMessage: string,
  validators?: UnaryValidator[]
): Namber {
  // Validate the input values
  const validation = unaryValidate(a, validators);

  // If there are any errors, return the errors along with the provided message
  if (validation.hasErrors) {
    return Namber(validation.errors, errorMessage);
  }

  // If the validation passed, return the result from the function
  return Namber(func(a.value as number));
}

/**
 * Helper function to take two Nambers and apply a binary function if both inputs are
 * valid.  The return value will include all the 'errors' from both types (if defined)
 *
 * @param a left-side of binary function.
 * @param b right-side of binary function.
 * @param func the underlying function to apply
 * @param errorMessage the user-friendl error message to use in case of validation failure
 * @param validators an optional collection of validators
 */
function binaryFunc(
  a: Namber,
  b: Namber,
  func: (left: number, right: number) => number,
  errorMessage: string,
  validators?: Validators
): Namber {
  // Validate the input values
  const validation = binaryValidate(a, b, validators);

  // If there are any errors, return the errors along with the provided message
  if (validation.hasErrors) {
    return Namber(validation.errors, errorMessage);
  }

  // If the validation passed, return the result from the function
  return Namber(func(a.value as number, b.value as number));
}

// This is a common error message
const INPUT_VALUE_NA = 'An input value is already n/a';

// Shortcut for valid zero values to use in reduce() and other places
export const ZERO = Namber(0);

/**
 * A set of basic math functions: add, sub, mul, div, pow, sqrt
 *
 * These function are meant to be used to replace normal +, -, *, / and
 * Math.sqrt and Math.pow, (or **), usages.
 *
 * All functions take a number | Namber to more easily integrate into existing
 * code and reduce code boilerplating.
 */
export function equal(a: Namber, b: Namber): boolean {
  // This follows the same rules as NaN comparison. Is either input is
  // a NotAPplicableValue, return false.  Otherwise, test the numbers.
  if (isNA(a) || isNA(b)) {
    return false;
  }

  return a.value === b.value;
}

export function add(a: Namber | number, b: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(b),
    (left, right) => left + right,
    INPUT_VALUE_NA
  );
}

export function sub(a: Namber | number, b: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(b),
    (left, right) => left - right,
    INPUT_VALUE_NA
  );
}

export function mul(a: Namber | number, b: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(b),
    (left, right) => left * right,
    INPUT_VALUE_NA
  );
}

export function div(a: Namber | number, b: Namber | number): Namber {
  const divByZeroCheck: Validators = {
    right: [
      unaryFactory(
        (_) => typeof _.value === 'number' && _.value !== 0,
        'Cannot divide by zero'
      ),
    ],
  };

  return binaryFunc(
    Namber(a),
    Namber(b),
    (left, right) => left / right,
    INPUT_VALUE_NA,
    divByZeroCheck
  );
}

export function pow(a: Namber | number, exp: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(exp),
    (left, right) => left ** right,
    INPUT_VALUE_NA
  );
}

export function min(a: Namber | number, exp: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(exp),
    (left, right) => Math.min(left, right),
    INPUT_VALUE_NA
  );
}

export function max(a: Namber | number, exp: Namber | number): Namber {
  return binaryFunc(
    Namber(a),
    Namber(exp),
    (left, right) => Math.max(left, right),
    INPUT_VALUE_NA
  );
}

export function sqrt(a: Namber | number): Namber {
  const lessThanZeroCheck: UnaryValidator[] = [
    unaryFactory(
      (_) => typeof _.value === 'number' && _.value >= 0,
      'Cannot take the sqrt() of a negative number'
    ),
  ];

  return unaryFunc(
    Namber(a),
    (arg) => Math.sqrt(arg),
    INPUT_VALUE_NA,
    lessThanZeroCheck
  );
}

export function round(a: Namber | number, decimals?: number): Namber {
  return unaryFunc(
    Namber(a),
    (arg) => dataUtilsRound(arg, decimals),
    INPUT_VALUE_NA
  );
}

/**
 * Exported wrapper around Namber() constructor that can be useful when importing
 * this module.
 */
export function toNamber(
  arg1: Namber | number | string | string[],
  message?: string
): Namber {
  return Namber(arg1, message);
}
