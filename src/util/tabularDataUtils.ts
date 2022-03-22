import {
  ClassificationScheme,
  GeoRecord,
  NAICSIndustryWithCoverage,
} from '../typings/appModels';
import {
  DataVariableDisplayProperties,
  DataVariableGeoTypeVintage,
} from '../typings/metadataModels';

import {
  findFeatureStat,
  findFeatureStatAsNamber,
} from '../services/dataService';
import * as ServiceUtils from '../services/support/serviceUtils';

import * as Nambers from './namber';

import { Namber } from './namber';
import { format, round } from './dataUtils';
import { DataRange } from '../typings/DataTypes';

// The data range should be pre-rounded to "roundTo" precision
function getEqualIntervalClasses(
  dataRange: DataRange,
  numRanges: number,
  roundTo: number
): DataRange[] {
  const allClasses: DataRange[] = [];
  if (Nambers.isNA(dataRange.minValue) || Nambers.isNA(dataRange.maxValue)) {
    return allClasses;
  }

  const min = dataRange.minValue.value;
  const max = dataRange.maxValue.value;

  const breaks = Math.max(
    round((max - min) / numRanges, roundTo),
    round(1 / 10 ** roundTo, roundTo)
  );

  let foundClasses = false;
  let previousMax = -Infinity;
  for (let i = 0; i < numRanges; i += 1) {
    const classMin =
      i === 0
        ? round(min + i * breaks, roundTo)
        : round(previousMax + 1 / 10 ** roundTo, roundTo);

    let classMax = round(classMin + breaks, roundTo);
    if (classMax >= max) {
      classMax = max;
      foundClasses = true;
    }
    previousMax = classMax;
    allClasses.push({
      minValue: Namber(classMin),
      maxValue: Namber(classMax),
    });
    if (foundClasses) {
      break;
    }
  }
  return allClasses;
}

function adjustRanges(
  ranges: DataRange[],
  bucketSizes: number[],
  dataValues: number[]
): void {
  let bucketNum = 0;
  while (bucketNum < ranges.length - 1) {
    const thisClassMax = ranges[bucketNum].maxValue.value;
    const nextClassMin = ranges[bucketNum + 1].minValue.value;
    const nextClassMax = ranges[bucketNum + 1].maxValue.value;
    if (thisClassMax === nextClassMin) {
      if (nextClassMin === nextClassMax) {
        bucketSizes[bucketNum] += bucketSizes[bucketNum + 1];
        ranges.splice(bucketNum + 1, 1);
        bucketSizes.splice(bucketNum + 1, 1);
      } else {
        let dataIndex = 0;
        for (let i = 0; i < bucketNum + 1; i += 1) {
          dataIndex += bucketSizes[i];
        }
        let numElementsFromNextBucket = 0;

        while (
          dataValues[dataIndex + numElementsFromNextBucket] === thisClassMax
        ) {
          numElementsFromNextBucket += 1;
        }

        ranges[bucketNum + 1].minValue = Namber(
          dataValues[dataIndex + numElementsFromNextBucket]
        );
        bucketSizes[bucketNum] += numElementsFromNextBucket;
        bucketSizes[bucketNum + 1] =
          bucketSizes[bucketNum + 1] - numElementsFromNextBucket;
      }
    }
    bucketNum += 1;
  }
}

function getQuantileClasses(
  dataValues: number[],
  _numClasses: number
): DataRange[] {
  const numValues = dataValues.length;
  let numClasses = _numClasses;
  if (numValues <= numClasses) {
    numClasses = numValues;
  }

  const bucketSizes = [];
  const bucketSize = Math.floor(numValues / numClasses);
  // Make each bucket hold at least "bucketSize" items
  let bucketNum = 0;
  for (; bucketNum < numClasses; bucketNum += 1) {
    bucketSizes[bucketNum] = bucketSize;
  }

  // Fit elements that overflow
  // Put one item at the start, then one at the end and so one unless entirely overflow has been accommodated
  let numOverflow = numValues % numClasses;
  let overflowStart = 0;
  let overflowEnd = numClasses - 1;
  for (; numOverflow > 0; ) {
    bucketSizes[overflowStart] += 1;
    overflowStart += 1;
    numOverflow -= 1;
    if (numOverflow === 0) {
      break;
    }
    bucketSizes[overflowEnd] += 1;
    overflowEnd -= 1;
    numOverflow -= 1;
  }

  const ranges = [];
  let startIndex = 0;
  bucketNum = 0;
  for (; bucketNum < numClasses; bucketNum += 1) {
    const minValue = Namber(dataValues[startIndex]);
    const maxValue = Namber(
      dataValues[startIndex + bucketSizes[bucketNum] - 1]
    );
    ranges.push({
      minValue,
      maxValue,
    });
    startIndex += bucketSizes[bucketNum];
  }
  adjustRanges(ranges, bucketSizes, dataValues);
  return ranges;
}

export function findLayerDataValues(
  features: GeoRecord[],
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): number[] {
  const featureValues = features.map((feature) =>
    findFeatureStat(feature, varGeoTypeVintage, selectedIndustryId)
  );
  const validValues = featureValues.filter((x) => x !== undefined) as number[];
  return validValues.sort((a, b) => a - b);
}

export function findLayerDataValuesAsNambers(
  features: GeoRecord[],
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): Namber[] {
  return features.map((feature) =>
    findFeatureStatAsNamber(feature, varGeoTypeVintage, selectedIndustryId)
  );
}

// Functions to classify data
export function findLayerDataRange(
  features: GeoRecord[],
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): DataRange {
  let min: Namber = Nambers.naNamber();
  let max: Namber = Nambers.naNamber();
  if (varGeoTypeVintage !== undefined) {
    findLayerDataValuesAsNambers(
      features,
      varGeoTypeVintage,
      selectedIndustryId
    ).forEach((dataValue) => {
      // if data value is a number then use that to update the min/max range
      if (Nambers.hasValue(dataValue)) {
        if (Nambers.hasValue(min)) {
          min = Nambers.min(dataValue, min);
        } else {
          min = dataValue;
        }
        if (Nambers.hasValue(max)) {
          max = Nambers.max(dataValue, max);
        } else {
          max = dataValue;
        }
      }
    });
  }
  return {
    minValue: min,
    maxValue: max,
  };
}

export function isInRange(dataRange: DataRange, dataValue: Namber): boolean {
  if (
    Nambers.isNA(dataRange.minValue) ||
    Nambers.isNA(dataRange.maxValue) ||
    Nambers.isNA(dataValue)
  ) {
    return false;
  }
  return (
    dataValue.value >= dataRange.minValue.value &&
    dataValue.value <= dataRange.maxValue.value
  );
}

export function classifyData(
  thematicData: GeoRecord[],
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string,
  classificationScheme: ClassificationScheme
): DataRange[] {
  const { numRanges, classificationMethod } = classificationScheme;
  switch (classificationMethod) {
    case 'equalInterval': {
      const dataRange = findLayerDataRange(
        thematicData,
        varGeoTypeVintage,
        selectedIndustryId
      );
      return getEqualIntervalClasses(
        dataRange,
        numRanges,
        varGeoTypeVintage === undefined ? 0 : varGeoTypeVintage.Round
      );
    }
    case 'quantile': {
      const dataValues = findLayerDataValues(
        thematicData,
        varGeoTypeVintage,
        selectedIndustryId
      );
      return getQuantileClasses(dataValues, numRanges);
    }
    default:
      return ServiceUtils.fail(
        `Unknown classification method ${classificationMethod}`
      );
  }
}

export function getIndustryIds(
  industries: NAICSIndustryWithCoverage[]
): string[] {
  return industries.map((industry) => industry.ID);
}

export function formatDataValue(
  dataVariable: DataVariableDisplayProperties,
  dataValue: Namber
): string {
  if (Nambers.isNA(dataValue)) {
    // return dataValue.message === undefined || dataValue.message === '' ? 'n/a' : dataValue.message;
    return dataValue.value;
  }
  const prefix = dataVariable.UOM_Prefix;
  const body = format(
    dataValue.value,
    dataVariable.Round,
    dataVariable.Format_Number
  );
  const suffix = dataVariable.UOM_Suffix;
  return `${prefix}${body}${suffix}`;
}
