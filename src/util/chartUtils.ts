import {
  ClusteredVariableMap,
  GeographicRankingResult,
  GeographyTypeToGeoRecordListMap,
  TimeSeriesRecord,
} from '../typings/appModels';
import { DataVariable } from '../typings/metadataModels';

export type ChartObject = {
  dataSeries: (number | 'n/a')[];
  labels: string[];
  legendLabel: Record<string, string>;
  dataVar: DataVariable;
};

export function formatForGeoComparisonChart(
  dataVar: DataVariable,
  [vars, geoTypes]: [ClusteredVariableMap, GeographyTypeToGeoRecordListMap],
  currentGeogName: string
): ChartObject {
  const { ID } = dataVar;

  // Build labels and dataSeries arrays
  const labelsArray = [currentGeogName];
  const currentVal = vars[ID][1].stat.value;
  const dataSeriesArray: number[] = [currentVal === 'n/a' ? 0 : currentVal];

  // 2nd array is for the parentGeo comparison, will need to loop through them
  Object.values(geoTypes).forEach(([{ name, data }]) => {
    const val = data[ID][1].stat.value;
    labelsArray.push(name);
    dataSeriesArray.push(val === 'n/a' ? NaN : val);
  });

  const chartObject = {
    dataSeries: dataSeriesArray,
    labels: labelsArray,
    legendLabel: { ID: 'Geo Comparison' },
    dataVar,
  };
  return chartObject;
}

export function formatGeoRankingChartData(
  dataVar: DataVariable,
  [currentGeography, peersList]: GeographicRankingResult
): ChartObject | undefined {
  // Check that there are actually geo's to compare to
  if (peersList.length < 1) {
    console.log('There is no geographic data to compare with.');
    return undefined;
  }

  const dataVarId = dataVar.ID;

  // Build labels and dataSeries arrays
  const labelsArray: string[] = [];
  const dataSeriesArray: number[] = [];

  [...currentGeography, ...peersList].forEach(({ name, data }) => {
    const val = data[dataVar.ID][1].stat.value;
    labelsArray.push(name);
    dataSeriesArray.push(val === 'n/a' ? NaN : val);
  });

  const chartObject = {
    dataSeries: dataSeriesArray,
    labels: labelsArray,
    legendLabel: { [dataVarId]: 'Geo Ranking' },
    dataVar,
  };
  return chartObject;
}

export function formatForTimeChart(
  dataVar: DataVariable,
  values: TimeSeriesRecord[]
): ChartObject | undefined {
  // Check that there is more than one value
  if (values.length < 2) {
    console.log('There is no time series data to compare with.');
    return undefined;
  }

  const dataVarId = dataVar.ID.toString();

  const dataSeriesArray: number[] = [];
  const labelsArray: string[] = [];

  values.forEach(({ data, name }) => {
    const val = data[dataVarId][1].stat.value;
    labelsArray.push(name);
    dataSeriesArray.push(val === 'n/a' ? NaN : val);
  });

  const chartObject = {
    dataSeries: dataSeriesArray,
    labels: labelsArray,
    legendLabel: { [dataVarId]: 'Over Time' },
    dataVar,
  };

  return chartObject;
}
