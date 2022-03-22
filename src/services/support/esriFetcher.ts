import { DataFetcher } from './dataFetcher';
import {
  ApiRecord,
  FetchDataParameters,
  DataVariablePartition,
} from './serviceTypes';
import { buildApiRecord, setApiData } from './serviceUtils';

import {
  NO_INDUSTRY_ID,
  DetailedGeo,
  GraphicLike,
} from '../../typings/appModels';
import { GeoType, VarParts } from '../../typings/metadataModels';

import { Namber } from '../../util/namber';
import * as QueryUtils from '../../util/queryUtils';
import { isNumberLike, toNumber } from '../../util/dataUtils';
import { fillStringTemplate } from '../../util/stringUtils';

export class EsriFetcher implements DataFetcher {
  constructor(private readonly consumerDataAPIUrl: string) {}

  public fetchData(params: FetchDataParameters): Promise<ApiRecord[]>[] {
    const { industryIdList, dataVarPart, geoType, partition } = params;

    return this.fetchEsri(industryIdList, dataVarPart, geoType, partition);
  }

  private fetchEsri(
    industryIdList: string[],
    dataVarPart: DataVariablePartition,
    geoType: GeoType,
    partition: DetailedGeo[]
  ): Promise<ApiRecord[]>[] {
    const geoIds = partition.map(
      (feature) => feature.attributes[geoType.GeoIdField] as string | number
    );
    let whereClause = QueryUtils.createInSQLQuery(
      geoType.ConsumerDataIdField,
      geoIds,
      true
    );
    if (dataVarPart.paramInd) {
      // add NAICS to where clause
      const industryClause = QueryUtils.createInSQLQuery(
        dataVarPart.paramInd,
        industryIdList,
        true
      );
      whereClause = `${whereClause} AND ${industryClause}`;
    }
    const varIds = dataVarPart.variableParts.map(
      (varPart) => varPart.statVariable.name
    );
    // const varAliases = dataVarPart.variableParts.map((varPart) => varPart.statVariable.alias);
    const outFields = [geoType.ConsumerDataIdField, varIds.join(',')];
    if (dataVarPart.paramInd) {
      outFields.push(dataVarPart.paramInd);
    }
    const query = QueryUtils.createQuery(
      false,
      outFields,
      whereClause,
      undefined,
      [geoType.ConsumerDataIdField]
    );
    const pagingParameters: QueryUtils.QueryPagingParams = { fetch: 'ALL' };
    const queryUrl = fillStringTemplate(
      { consumerDataAPIUrl: this.consumerDataAPIUrl },
      dataVarPart.apiUrl
    );

    const queryPromise = QueryUtils.runQuery(
      queryUrl,
      query,
      pagingParameters
    ).then(([feats, fields]) => {
      const _geos = QueryUtils.graphicsToGraphicLike(feats, fields);
      return EsriFetcher.mergeConsumerDataAPIResults(
        geoType,
        partition,
        _geos,
        dataVarPart,
        industryIdList,
        dataVarPart.variableParts
      );
    });
    return [queryPromise];
  }

  private static mergeConsumerDataAPIResults(
    geoType: GeoType,
    tigerGeos: DetailedGeo[],
    consumerDataApiData: GraphicLike[],
    dataVarPartition: DataVariablePartition,
    industryIdList: string[],
    variableParts: VarParts[]
  ): ApiRecord[] {
    return tigerGeos.map((tigerGeo) => {
      // This constructs a record and deep clones the attributes and other information.
      const apiGeoRecord = buildApiRecord(geoType, tigerGeo);
      let industryIds: string[];
      // check if naics
      if (dataVarPartition.paramInd) {
        industryIds = industryIdList;
      } else {
        industryIds = [NO_INDUSTRY_ID];
      }
      EsriFetcher.setData(
        geoType,
        tigerGeo,
        consumerDataApiData,
        industryIds,
        variableParts,
        apiGeoRecord
      );
      return apiGeoRecord;
    });
  }

  private static setData(
    geoType: GeoType,
    tigerGeo: DetailedGeo,
    consumerDataApiData: GraphicLike[],
    industryIdList: string[],
    variableParts: VarParts[],
    apiGeoRecord: ApiRecord
  ): void {
    // for each sector
    industryIdList.forEach((industryId) => {
      const apiData = EsriFetcher.findApiRecord(
        consumerDataApiData,
        geoType.ConsumerDataIdField,
        tigerGeo.id,
        industryId
      );
      variableParts.forEach((varParts) => {
        const statVarId = varParts.statVariable.alias;
        const moeVarId =
          varParts.moeVariable === undefined
            ? undefined
            : varParts.moeVariable.alias;
        // If no data then set to no immendiately
        if (apiData === undefined) {
          setApiData(
            industryId,
            apiGeoRecord.data,
            { variableId: statVarId, value: Namber('n/a') },
            moeVarId !== undefined
              ? { variableId: moeVarId, value: Namber('n/a') }
              : undefined
          );
        } else {
          // find data in sector
          const varData = apiData.attributes;
          const hasFlag = varParts.flagVariable !== undefined;

          const flagValue = hasFlag
            ? varData[varParts.flagVariable!.alias]
            : undefined;
          if (hasFlag && flagValue !== null) {
            setApiData(
              industryId,
              apiGeoRecord.data,
              {
                variableId: statVarId,
                value: Namber(`Suppressed (${flagValue})`),
              },
              moeVarId !== undefined
                ? { variableId: moeVarId, value: Namber('n/a') }
                : undefined
            );
          } else {
            const statValue = varData[varParts.statVariable.name];
            let moeValue: Namber | undefined;
            if (moeVarId !== undefined) {
              const moe = varData[varParts.moeVariable!.name];
              if (isNumberLike(moe)) {
                moeValue = Namber(toNumber(moe));
              } else {
                moeValue = Namber('n/a');
              }
            }
            if (isNumberLike(statValue)) {
              setApiData(
                industryId,
                apiGeoRecord.data,
                {
                  variableId: statVarId,
                  value: Namber(toNumber(statValue)),
                },

                moeVarId !== undefined
                  ? { variableId: moeVarId, value: moeValue! }
                  : undefined
              );
            } else {
              setApiData(
                industryId,
                apiGeoRecord.data,
                { variableId: statVarId, value: Namber('n/a') },
                moeVarId !== undefined
                  ? { variableId: moeVarId, value: Namber('n/a') }
                  : undefined
              );
            }
          }
        }
      });
    });
  }

  private static findApiRecord(
    consumerDataApiData: GraphicLike[],
    idField: string,
    id: string,
    industryId: string
  ): GraphicLike | undefined {
    return consumerDataApiData
      .filter((apiFeature) => apiFeature.attributes[idField] === id)
      .filter((apiFeature) => {
        const featureIndustry = apiFeature.attributes.NAICS;

        return (
          featureIndustry === undefined ||
          (featureIndustry !== undefined && featureIndustry === industryId)
        );
      })[0];
  }
}
