import {
  GeographicComparisonParameters,
  GeographicComparisonResult,
  GeographyPartitionsMap,
  TabularResult,
} from '../../typings/appModels';
import { MetadataService } from '../metadataService';
import { Summarizer } from './Summarizer';

export class GeographicComparisonTabulator extends Summarizer {
  public getGeographicComparisonData(
    params: GeographicComparisonParameters
  ): Promise<GeographicComparisonResult> {
    const {
      dataVariable,
      geographiesMap,
      industryIdList,
      parentGeos,
      // geoOrRegionName,
      vintage,
    } = params;

    const baseResult = this.getSummarizedData({
      geographiesMap,
      industryIdList,
      dataVariableList: [dataVariable],
      vintage,
    });

    const parentGeoTypes: string[] = [];

    // Iterate over parentGeos
    // Retrieve data for only those types for which geo vintage of the same type is applicable as the base geo
    Object.keys(parentGeos).forEach((geoTypeId) => {
      const geoTypeVintagesList = MetadataService.getGeoVintagesForVariable(
        dataVariable.ID
      );
      geoTypeVintagesList
        .filter(
          (vintageData) =>
            vintageData.geoTypeId === geoTypeId &&
            vintageData.vintageId === vintage
        )
        .forEach(() => {
          const parentGeoType = MetadataService.getGeoType(geoTypeId);
          parentGeoTypes.push(parentGeoType.ID);
        });
    });

    // Now get the actual geos for the types filtered
    const filteredParentGeos = parentGeoTypes.reduce((agg, geoTypeId) => {
      agg[geoTypeId] = parentGeos[geoTypeId];
      return agg;
    }, {} as GeographyPartitionsMap);

    const parentResult: Promise<TabularResult> = this.getTabularData({
      geographiesMap: filteredParentGeos,
      industryIdList,
      dataVariableList: [params.dataVariable],
      vintage: params.vintage,
    });

    const gcResult: Promise<GeographicComparisonResult> = Promise.all([
      baseResult,
      parentResult,
    ]).then((results) => [results[0], results[1]]);

    return gcResult;
  }
}
