import { MetadataService } from './metadataService';

import { DataFetcher } from './support/dataFetcher';
import { getDataPartitionsByEndPts } from './support/dataPartitioner';
import {
  ApiRecord,
  FetchDataParameters,
  GeographyTypeToApiRecordListMap,
  TabularDefinitionsParameters,
} from './support/serviceTypes';
import * as ServiceUtils from './support/serviceUtils';

import { GeographyPartitions, TabularParameters } from '../typings/appModels';
import {
  DataVariable,
  GeoTypeVintageId,
  GeoType,
} from '../typings/metadataModels';

import { all as cbbPromiseAll } from '../util/promiseUtils';

export type ApiTypeParameter = {
  geoType: GeoType;
  allPartitions: GeographyPartitions;
  industryIdList: string[];
  dataVariableList: DataVariable[];
  vintage: GeoTypeVintageId;
};

/**
 * Merge together the data across multiple geo records.  Is is assumed that all
 * of the GeoRecords are for the same geoId item.
 */
function recursiveMerge<T>(a: T, b: T): T {
  const obj = { ...a };
  Object.keys(b).forEach((key) => {
    if (!(key in a)) {
      obj[key] = b[key];
    } else if (typeof obj[key] === 'object' && typeof b[key] === 'object') {
      obj[key] = recursiveMerge(obj[key], b[key]);
    }
  });

  return obj;
}

function mergeGeoRecordData(records: ApiRecord[]): ApiRecord {
  const [first, ...rest] = records;
  rest.forEach((record) => {
    first.data = recursiveMerge(first.data, record.data);
  });
  return first;
}

export class APIService {
  constructor(
    readonly censusFetcher: DataFetcher,
    readonly esriFetcher: DataFetcher,
    readonly userFetcher: DataFetcher
  ) {}

  public createAPIQueries(
    params: TabularParameters
  ): Promise<GeographyTypeToApiRecordListMap> {
    // Create an object of promises that is appropriate input to promises/all
    const deferredQueries = Object.keys(params.geographiesMap).reduce(
      (acc, gTypeId) => {
        const geoType = MetadataService.getGeoType(gTypeId);
        const geoTypeParms = {
          geoType,
          allPartitions: params.geographiesMap[gTypeId],
          industryIdList: params.industryIdList,
          dataVariableList: params.dataVariableList,
          vintage: params.vintage, // Must allow undefined vintage to propagate
        };

        const geosForType = this.createAPIQueriesForGeoType(geoTypeParms).then(
          (results) => {
            // The result can come back with more elements than the inputs due to variable
            // partitioning across multiple service endpoints.
            const flatResults = results.flat(2);

            // Map over the input parameters, group the results by geoId and create a merged
            // GeoRecord with the aggregated data values.
            const geoRecords = geoTypeParms.allPartitions.reduce(
              (geoTypeAgg, partition) => {
                const geosForPartition = partition.map((record) => {
                  // Find all of the results with the same geoId
                  const matches = flatResults.filter(
                    (item) => item.id === record.id
                  );
                  // Merge the GeoRecords together
                  return mergeGeoRecordData(matches);
                });
                return [...geoTypeAgg, ...geosForPartition];
              },
              []
            );
            return geoRecords;
          }
        );

        acc[gTypeId] = geosForType as Promise<ApiRecord[]>;
        return acc;
      },
      {} as Record<string, Promise<ApiRecord[]>>
    );

    // Replace with native all implementation
    return cbbPromiseAll(deferredQueries);
  }

  private createAPIQueriesForGeoType(
    geoTypeParms: ApiTypeParameter
  ): Promise<ApiRecord[][][]> {
    // summarizeData and vintage are optional
    const {
      allPartitions,
      industryIdList,
      geoType,
      dataVariableList,
      vintage,
    } = geoTypeParms;
    // hash map by api url, contains list of var Ids
    // for all geo's in each partition,
    // get all vars together if they have same end points
    const paramsEndPts = {
      dataVariableList,
      geoTypeId: geoType.ID,
      vintage,
    };
    const dataVarPartition = getDataPartitionsByEndPts(paramsEndPts);
    const paramsTabDefs = {
      dataVarPartition,
      allPartitions,
      industryIdList,
      geoType,
    };

    return Promise.all(this.getTabularDefs(paramsTabDefs));
  }

  private getTabularDefs(
    params: TabularDefinitionsParameters
  ): Promise<ApiRecord[][]>[] {
    const { allPartitions, dataVarPartition } = params;
    return allPartitions
      .map((partition) =>
        Object.values(dataVarPartition).map((dataVarPart) => {
          if (dataVarPart.mapStateIds[0]) {
            // further partition by state for trade data i.e if mapstate Id is true
            return partition.map((part) =>
              this.fetchData(
                Object.assign(params, { dataVarPart, partition: [part] })
              )
            );
          }
          return this.fetchData(
            Object.assign(params, { dataVarPart, partition })
          );
        })
      )
      .flat(2);
  }

  private fetchData(params: FetchDataParameters): Promise<ApiRecord[][]> {
    let promises: Promise<ApiRecord[]>[] = [];
    switch (params.dataVarPart.dataSource) {
      case 'CENSUS_DATA_API':
        promises = this.censusFetcher.fetchData(params);
        break;
      case 'ESRI_CONSUMER_DATA':
        promises = this.esriFetcher.fetchData(params);
        break;
      case 'USER_UPLOADED_DATA':
        promises = this.userFetcher.fetchData(params);
        break;
      default:
        ServiceUtils.fail('Missing program source code path');
    }

    return Promise.all(promises);
  }
}
