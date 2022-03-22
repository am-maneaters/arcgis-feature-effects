import {
  GeographicRankingParameters,
  GeographicRankingResult,
  GeographyPartitionsMap,
  GeoRecord,
  TabularResult,
} from '../../typings/appModels';
import { MetadataService } from '../metadataService';
import { Summarizer } from './Summarizer';

export class GeographicRankingTabulator extends Summarizer {
  public getGeographicRankingData(
    params: GeographicRankingParameters
  ): Promise<GeographicRankingResult> {
    const {
      dataVariable,
      geographiesMap, // will only have one geolevel with an array of peer geographies for comparison
      industryIdList,
      selectedGeography,
      resultCount, // number of peer elements to return
      resultOrder, // Meant to be either 'ASCENDING' or 'DESCENDING'
      vintage,
      geographyPerRequestLimit,
    } = params;

    // get vintages for current target peer geography
    const peerGeoTypes: string[] = [];

    Object.keys(geographiesMap).forEach((geoTypeId) => {
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
          const peerGeoType = MetadataService.getGeoType(geoTypeId);
          peerGeoTypes.push(peerGeoType.ID);
        });
    });

    // Mainly for states with 1000+ zipcodes like Texas, we need to split up the geographiesMap sent to the TabularData query and expect them in a promise
    const peerResult: Promise<TabularResult>[] = [];
    if (
      geographiesMap[selectedGeography.geoType.ID][0].length >
      geographyPerRequestLimit
    ) {
      // can make this more efficient
      for (
        let r = 0;
        r < geographiesMap[selectedGeography.geoType.ID][0].length;
        r += 1100
      ) {
        const reducedArray: GeographyPartitionsMap = { zcta: [] };
        const tempArray = geographiesMap.zcta[0].slice(
          r,
          r + geographyPerRequestLimit
        );
        reducedArray[selectedGeography.geoType.ID][0] = tempArray;

        peerResult.push(
          this.getTabularData({
            geographiesMap: reducedArray,
            industryIdList,
            dataVariableList: [params.dataVariable],
            vintage: params.vintage,
          })
        );
      }
    } else {
      // sub 1100 results
      peerResult.push(
        this.getTabularData({
          geographiesMap,
          industryIdList,
          dataVariableList: [params.dataVariable],
          vintage: params.vintage,
        })
      );
    }

    // gcResult will generally have a rather large array for georanking
    const gcResult: Promise<GeographicRankingResult> = Promise.all(
      // baseResult,
      peerResult
    ).then((results) => {
      // The need to concatentate for 1000+ geogs should only occur with zcta.
      let mergedPeerArray: GeoRecord[] = [];
      results.forEach((peerArray) => {
        mergedPeerArray = mergedPeerArray.concat(
          peerArray[selectedGeography.geoType.ID]
        );
      });

      // Separate out the selected value out of the array
      const selectedGeogResult = mergedPeerArray.filter(
        (geog) => geog.id === selectedGeography.id
      );

      // Remove the selected element from the result array
      const rankCompArray = mergedPeerArray.filter(
        (geog) => geog.id !== selectedGeography.id
      );

      // Remove the selected element from the result array
      const rankCompNAFilterArray = rankCompArray.filter(
        (geog2) => geog2.data[dataVariable.ID][1].stat.value !== 'n/a'
      );

      // Sort out the array
      if (resultOrder === 'ASCENDING') {
        rankCompNAFilterArray.sort((a, b) =>
          a.data[dataVariable.ID][1].stat.value >
          b.data[dataVariable.ID][1].stat.value
            ? 1
            : -1
        );
      } else {
        // DESCENDING
        rankCompNAFilterArray.sort((a, b) =>
          a.data[dataVariable.ID][1].stat.value <
          b.data[dataVariable.ID][1].stat.value
            ? 1
            : -1
        );
      }

      // Get only desired amount of peers
      const limitRankCompArray = rankCompNAFilterArray.slice(0, resultCount);

      return [selectedGeogResult, limitRankCompArray];
    });

    return gcResult;
  }
}
