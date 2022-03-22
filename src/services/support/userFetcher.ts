import { DataFetcher } from './dataFetcher';
import {
  ApiRecord,
  DataVariablePartition,
  FetchDataParameters,
} from './serviceTypes';
import { buildApiRecord, setApiData } from './serviceUtils';

import { NO_INDUSTRY_ID, DataRow, DetailedGeo } from '../../typings/appModels';
import { GeoType } from '../../typings/metadataModels';

import { isNumberLike, toNumber } from '../../util/dataUtils';
import { Namber } from '../../util/namber';
import { UserDataClientUtils } from '../../util/userDataClientUtils';

const userDataClientUtils: UserDataClientUtils =
  UserDataClientUtils.getInstance();

export class UserFetcher implements DataFetcher {
  constructor() {}

  public fetchData(params: FetchDataParameters): Promise<ApiRecord[]>[] {
    const { dataVarPart, geoType, partition } = params;
    return [
      Promise.resolve(
        UserFetcher.fetchUserData(dataVarPart, geoType, partition)
      ),
    ];
  }

  private static fetchUserData(
    dataVarPart: DataVariablePartition,
    geoType: GeoType,
    partition: DetailedGeo[]
  ): ApiRecord[] {
    // Get the user data
    const userData = userDataClientUtils.getUploadedUserData();
    const [headers, ...userDataRows] = userData.attributeData;
    // Find user data records that match the geoIDs and create a ApiRecord for each of them.
    return partition.map((tigerGeo) => {
      const apiGeoRecord = buildApiRecord(geoType, tigerGeo);
      const dataRow = UserFetcher.findUploadedGeo(userDataRows, tigerGeo.id);
      if (dataRow === undefined) {
        dataVarPart.variableParts.forEach((varParts) => {
          const statVarId = varParts.statVariable.alias;
          setApiData(
            NO_INDUSTRY_ID,
            apiGeoRecord.data,
            { variableId: statVarId, value: Namber('n/a') },
            undefined
          );
        });
      } else {
        dataVarPart.variableParts.forEach((varParts) => {
          const statVarId = varParts.statVariable.alias;
          // Value must be retrieved from the name field because that is what data row has
          const statValue =
            dataRow[headers.indexOf(varParts.statVariable.name)];
          if (isNumberLike(statValue)) {
            setApiData(
              NO_INDUSTRY_ID,
              apiGeoRecord.data,
              {
                variableId: statVarId,
                value: Namber(toNumber(statValue)),
              },
              // No support for MoE's for user uploaded variables
              undefined
            );
          } else {
            setApiData(
              NO_INDUSTRY_ID,
              apiGeoRecord.data,
              { variableId: statVarId, value: Namber('n/a') },
              undefined
            );
          }
        });
      }
      return apiGeoRecord;
    });
  }

  private static findUploadedGeo(dataRows: DataRow[], geoId: string): DataRow {
    return dataRows.filter((dataRow) => dataRow[0] === geoId)[0];
  }
}
