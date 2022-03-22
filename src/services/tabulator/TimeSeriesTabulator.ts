import {
  SummaryResult,
  TimeSeriesParameters,
  TimeSeriesRecord,
  TimeSeriesResult,
} from '../../typings/appModels';
import { DataVariableGeoTypeVintage } from '../../typings/metadataModels';
import { MetadataService } from '../metadataService';
import { Summarizer } from './Summarizer';

export class TimeSeriesTabulator extends Summarizer {
  public getTimeSeriesData(
    params: TimeSeriesParameters
  ): Promise<TimeSeriesResult> {
    const { geographiesMap, industryIdList, dataVariable } = params;

    // Assume there is only one geo type
    const geoTypeMapKeys = Object.keys(params.geographiesMap);

    // Time series is always requested for a single geo type
    const geoType = MetadataService.getGeoType(geoTypeMapKeys[0]);

    // get all vintages for dataVariable
    const allVintages: DataVariableGeoTypeVintage[] = [];

    const geoTypeVintagesList = MetadataService.getGeoVintagesForVariable(
      dataVariable.ID
    );
    const defarray: Promise<SummaryResult>[] = geoTypeVintagesList
      .filter((geoVintageData) => geoVintageData.geoTypeId === geoType.ID)
      .map((geoVintageData) => {
        allVintages.push(geoVintageData);
        const summaryParams = {
          geographiesMap,
          industryIdList,
          dataVariableList: [dataVariable],
          vintage: geoVintageData.vintageId,
        };
        return this.getSummarizedData(summaryParams);
      });

    return Promise.all(defarray).then((results: SummaryResult[]) => {
      const response: TimeSeriesResult = allVintages.map((v, index) => ({
        vintage: v.vintageId,
        name: v.years.join(';'),
        data: results[index],
      }));
      const sortedTimeSeries = response.sort(
        (vintage1: TimeSeriesRecord, vintage2: TimeSeriesRecord) =>
          vintage1.name.localeCompare(vintage2.name)
      );
      return sortedTimeSeries;
    });
  }
}
