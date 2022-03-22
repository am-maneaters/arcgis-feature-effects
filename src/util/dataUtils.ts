import { isNumber, isFinite, isString } from 'lodash-es';

/**
 * Main utility class to validate and convert between data types (mostly number and string).
 * Use the isNumberLike and isStringLike functions to validate data values that may be
 * masqurading as a different type and convert them to appropriate type.
 * This will mostly happen where CBB app interacts with external data e.g. reading from a
 * bookmark URL, Census data API, ArcGIS services etc. The conversion to the correct data type
 * should happen as close to the point of interface as possible e.g. in bookmarkController or
 * dataService so we can take full advantage of type safety in the rest of the application.
 */

const parserRegEx =
  /^((-(([1-9][0-9]*[0-9]?(\.\d+)?)|(0(\.\d+))|(\.\d+)))|(([1-9][0-9]*[0-9]?(\.\d+)?)|(0(\.\d+)?)|(\.\d+)))$/;

const formatRegEx = /(\d)(?=(\d{3})+(?!\d))/g;

/**
 * Checks whether the input value is convertible to a number.
 * CBB's definition of number is much more strict than that of Javascript.
 * More specifically CBB only deals with numbers that are finite (Number.NEGATIVE_INFINITY < x < Number.POSITIVE_INFINITY) and not NaN.
 * If the input value is a string then it must be in decimal notation. In other words it does not support numbers that are written in
 * exponent notation e.g. 1.2e2, which otherwise is a valid number. See this function's unit tests for examples ofvalid and invalid inputs.
 * @param value Value to check
 * @returns true if the value can be converted to a number, false otherwise
 */
export function isNumberLike(value: unknown): boolean {
  return (
    (isNumber(value) && isFinite(value)) ||
    (isString(value) && parserRegEx.test(value))
  );
}

/**
 * Converts a number like value to a true number.
 * Value to be converted should first be validated using the isNumberLike function.
 * @param value Value to convert
 * @returns Value converted to a number
 * @throws Error when input value can't be converted to a number
 */
export function toNumber(value: unknown): number {
  if (isNumberLike(value)) {
    if (isNumber(value)) {
      return value;
    }
    if (isString(value)) {
      return Number(value);
    }
  }
  throw new Error(
    `Input "${value}" can't be converted to a number. Did you forget to validate it using isNumberLike function on this class?`
  );
}

/**
 * Rounds the input number to a the specified decimals places.
 * Value to be rounded should first be converted to a true number using toNumber function.
 * @param value Number to round
 * @param decimal optional number of decimals places to round the value to (must be between 0 and 20) - defaults to 0
 * @returns Number rounded to the specified number of decimal places
 * @throws Error when input value can't be converted to a number
 */
export function round(value: number, decimals = 0): number {
  return +Number(
    `${Math.round(`${toNumber(value)}e${decimals}` as any)}e-${decimals}`
  ).toFixed(decimals);
}

/**
 * Formats input number (with commas, if specified) and includes the specified decimals places.
 * Value to be formatted should first be converted to a true number using toNumber function.
 * @param value Number to round
 * @param decimal optional number of decimals places to round the value to (must be between 0 and 20) - defaults to 0
 * @param useCommas optional flag to indicate whether the formatted value should be comma separated - defaults to true
 * @returns Formatted number as string
 * @throws Error when input value can't be converted to a number
 */
export function format(value: number, decimals = 0, useCommas = true): string {
  const stringifiedValue = round(value, decimals).toFixed(decimals);
  return useCommas === false
    ? stringifiedValue
    : stringifiedValue.replace(formatRegEx, '$1,');
}

/**
 * Checks whether the input value is convertible to a string or not. Only a real string type or a number like
 * input will return true. All other inputs such as array, object, undefined will return false.
 * See this function's unit tests for examples ofvalid and invalid inputs.
 * @param value Value to check
 * @returns true if the value can be converted to a string, false otherwise
 */
export function isStringLike(value: unknown): boolean {
  return isNumberLike(value) || isString(value);
}

/**
 * Converts a string like value to a true string.
 * Value to be converted should first be validated using the isStringLike function.
 * The returned value is not formatter in any way e.g. it won't return '0.00' if the
 * input string is '0.00' but simply a '0' instead. This function is meant to
 * be used when a number like ID (2) column needs to be converted to a string ('2').
 * Use the format function from this class to format a number and/or stringwith a certain
 * number of decimal digits.
 * @param value Value to convert
 * @returns Value converted to a string
 * @throws Error when input value can't be converted to a string
 */
export function toString(value: unknown): string {
  if (isStringLike(value)) {
    if (isNumber(value)) {
      return Number(value).toString();
    }
    if (isString(value)) {
      return value;
    }
  }
  throw new Error(
    `Input ${value} can't be converted to a string. Did you forget to validate it using isStringLike function on this class?`
  );
}

/**
 * Checks whether the input value is an empty string.
 * Value to be checked should first be validated using the isStringLike function.
 * With the latest metadata processing changes, there should be very few instances where an empty value is being used.
 * @param value Value to check
 * @returns true if string is empty or only contains white spaces, false otherwise
 * @throws Error when input value isn't a string like value
 */
export function isEmptyString(value: unknown): boolean {
  return toString(value).trim() === '';
}
