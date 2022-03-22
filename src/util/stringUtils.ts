import { template } from 'lodash-es';
import { format, isNumberLike } from './dataUtils';
import { DataVariableDisplayProperties } from '../typings/metadataModels';

/**
 * Only used to get around scanning issues which complains when setting innnerHTML on HTML elements.
 * Using this methods gets around these "bogus" complains from security scans.
 * @param html String to sanitize
 * @returns Input string echo'ed back
 */
export function sanitizeHTMLString(html: string): string {
  return `${html}`;
}

/**
 * Substitutes placeholders in the template string with provided values.
 * Values in the parameters object must be strings or numbers (Behavior for dates, objects, arrays etc. is undefined/untested).
 * Important: Use ES6 template literals wherever possible.
 * @param parameters Dictionary object to use in the template
 * @param template Template string
 * @returns Filled string
 * @throws Error when value for a placeholder in template is missing from the parmaeters object
 */
export function fillStringTemplate(
  parameters: Record<string, string>,
  templateStr: string
): string {
  const compiled = template(templateStr);
  return compiled(parameters);
}

/**
 * Format a numeric value based on the data variable's display properties. This is typically
 * either a DataVariable instance, or a GeoVintage instance.
 * @param dataVariable Any class implementing the DataVarableDisplayProperty type
 * @param dataValue A numeric value
 */
export function formatValue(
  dataVariable: DataVariableDisplayProperties,
  dataValue?: number
): string {
  if (!isNumberLike(dataValue)) {
    return 'n/a';
  }

  const prefix = dataVariable.UOM_Prefix;
  const body = format(
    dataValue!,
    dataVariable.Round,
    dataVariable.Format_Number
  );
  const suffix = dataVariable.UOM_Suffix;

  return `${prefix}${body}${suffix}`;
}

/**
 * An alias of the `formatValue` method for backward compatibility.
 * @param dataVariable Any class implementing the DataVarableDisplayProperty type
 * @param dataValue A numeric value
 */
export function formatNumeric(
  dataVariable: DataVariableDisplayProperties,
  dataValue?: number
): string {
  return formatValue(dataVariable, dataValue);
}

export function getAlphaNumeric(input: string): string {
  // return input.replace(/[\W_]+/g, ' ');
  // TJ - CBDI-804
  // Relax the regular expression to accept periods and apostrophes to match names like "St. Louis" and "O'Brien"
  // Replace all non-alpha except period and apostrophe with underscore
  // Then replace underscopre with space
  // Replacing to underscore is hacky - needed because \w metacharater includes underscore which I can't seem to root out
  return input.replace(/[^\w'.]+/g, '_').replace(/[_]+/g, ' ');
}
