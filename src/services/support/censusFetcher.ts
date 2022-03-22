import { chunk } from 'lodash-es';
import { isNumberLike, toNumber } from '../../util/dataUtils';
import { DataFetcher } from './dataFetcher';
import {
  ApiRecord,
  DataVariablePartition,
  FetchDataParameters,
} from './serviceTypes';
import {
  buildApiRecord,
  createOutFields,
  getIndustryLikeId,
  setApiData,
  translateToAnnotation,
} from './serviceUtils';

import { MetadataService } from '../metadataService';

import { NO_INDUSTRY_ID, DetailedGeo } from '../../typings/appModels';
import { GeoType, VarParts } from '../../typings/metadataModels';

import { ClientUtils } from '../../util/clientUtils';
import * as LogUtils from '../../util/logUtils';

import * as Nambers from '../../util/namber';

import { Namber } from '../../util/namber';
import { ColumnPartitionMerger } from './ColumnPartitionMerger';
import { APIRowToObjectConverter } from './APIRowToObjectConverter';
import {
  CensusApiGeoRecord,
  CensusAPIDataObject,
  DataQueryParameters,
  ApiUrlParameters,
  DataAPIQueryParameters,
  MergeParameters,
  CensusAPIDataResult,
  GeoAndIndustryParameters,
} from './FetcherTypes';

export class CensusFetcher implements DataFetcher {
  private readonly clientUtils: ClientUtils;

  constructor(clientUtils: ClientUtils) {
    this.clientUtils = clientUtils;
  }

  // The old ES6 code only modified the 'partition' variable (called tigerGeos in other functions) in-place.
  // The TS code also returns the partitions and a bridge to removing side-effects from these functions later.
  // Ideally, we would be able to create interfaces for some core type aliases with
  // all properties marked as readonly.
  fetchData({
    industryIdList,
    dataVarPart,
    geoType,
    partition,
  }: FetchDataParameters): Promise<ApiRecord[]>[] {
    return this.fetchCensus(industryIdList, dataVarPart, geoType, partition);
  }

  public fetchCensus(
    industryIdList: string[],
    dataVarPart: DataVariablePartition,
    geoType: GeoType,
    partition: DetailedGeo[]
  ): Promise<ApiRecord[]>[] {
    const defList: Promise<ApiRecord[]>[] = [];
    if (geoType.MapTigerId) {
      const mappableVariables = CensusFetcher.findMappableVariables(
        true,
        dataVarPart.mapTigerIds,
        dataVarPart.variableParts
      );
      if (mappableVariables.length > 0) {
        // do query true
        const specialDef = this.executeDataAPIQueries(
          true,
          industryIdList,
          true,
          dataVarPart,
          geoType,
          partition,
          mappableVariables
        );
        defList.push(specialDef);
      }
      const regularVariables = CensusFetcher.findMappableVariables(
        false,
        dataVarPart.mapTigerIds,
        dataVarPart.variableParts
      );
      if (regularVariables.length > 0) {
        // do query false
        const regDef = this.executeDataAPIQueries(
          true,
          industryIdList,
          false,
          dataVarPart,
          geoType,
          partition,
          regularVariables
        );
        defList.push(regDef);
      }
    } else {
      const otherDef = this.executeDataAPIQueries(
        false,
        industryIdList,
        false,
        dataVarPart,
        geoType,
        partition
      );
      defList.push(otherDef);
    }
    return defList;
  }

  private static findMappableVariables(
    isMapId: boolean,
    mapTigerIds: boolean[],
    variableParts: VarParts[]
  ): VarParts[] {
    return variableParts.filter(
      (variablePart, i) => mapTigerIds[i] === isMapId
    );
  }

  public async executeDataAPIQueries(
    isPlaces: boolean,
    industryIdList: string[],
    mapTigerIdsBool: boolean,
    dataVarPart: DataVariablePartition,
    geoType: GeoType,
    partitionGeos: DetailedGeo[],
    placesObj?: VarParts[]
  ): Promise<ApiRecord[]> {
    const apiQueryResults =
      await this.executeDataAPIQueriesForDataVariablePartition(
        industryIdList,
        mapTigerIdsBool,
        dataVarPart,
        geoType,
        partitionGeos
      );
    const censusApiGeoData = apiQueryResults.reduce(
      (acc, queryResult) =>
        isPlaces === true ? Object.assign(acc, queryResult) : queryResult,
      {}
    );
    return CensusFetcher.mergeCensusDataAPIResults(
      geoType,
      partitionGeos,
      censusApiGeoData,
      dataVarPart,
      industryIdList,
      isPlaces === true && placesObj !== undefined
        ? placesObj
        : dataVarPart.variableParts
    );
  }

  /**
   * Returns the tigerGeos after modifying/creating the attributes.data object
   * @param geoType
   * @param tigerGeos: DetailedGeo
   * @param censusApiGeoData
   * @param dataVarPartition
   * @param industryIdList
   * @param varParts
   */
  public static mergeCensusDataAPIResults(
    geoType: GeoType,
    tigerGeos: DetailedGeo[],
    censusApiGeoData: CensusApiGeoRecord,
    dataVarPartition: DataVariablePartition,
    industryIdList: string[],
    variableParts: VarParts[]
  ): ApiRecord[] {
    const tigerFIPSFields = createOutFields(...geoType.TigerFIPSFields);

    // Loop over the tigerGeos and create a GeoRecord for each
    return tigerGeos.map((tigerGeo) => {
      // This constructs a record and deep clones the attributes and other information.
      const apiGeoRecord = buildApiRecord(geoType, tigerGeo);

      let geoName = '';
      if (geoType.ID === 'nation') {
        geoName = geoType.ID;
      } else {
        tigerFIPSFields.forEach((field) => {
          geoName = `${geoName + field}=${tigerGeo.attributes[field]}`;
        });
      }

      let industryIds: string[];
      // check if naics
      if (dataVarPartition.paramInd !== undefined) {
        industryIds = industryIdList;
      } else {
        industryIds = [NO_INDUSTRY_ID];
      }
      if (censusApiGeoData[geoName]) {
        const apiData = censusApiGeoData[geoName];
        CensusFetcher.setData(
          industryIds,
          variableParts,
          apiGeoRecord,
          apiData
        );
      } else {
        // Geo not found - mark as 'n/a'
        // This could be because data has not been released or is not available
        CensusFetcher.setData(industryIds, variableParts, apiGeoRecord);
      }
      return apiGeoRecord;
    });
  }

  private static setData(
    industryIdList: string[],
    variableParts: VarParts[],
    apiGeoRecord: ApiRecord,
    apiData?: Record<string, CensusAPIDataObject[]>
  ): void {
    // for each sector
    industryIdList.forEach((selectedIndustryId) => {
      variableParts.forEach((varParts) => {
        const statVarId = varParts.statVariable.alias;
        const moeVarId =
          varParts.moeVariable === undefined
            ? undefined
            : varParts.moeVariable.alias;
        // If no data then set to n/a immediately
        if (apiData === undefined) {
          setApiData(
            selectedIndustryId,
            apiGeoRecord.data,
            { variableId: statVarId, value: Nambers.naNamber() },
            moeVarId !== undefined
              ? { variableId: moeVarId, value: Nambers.naNamber() }
              : undefined
          );
        } else {
          // find data in sector
          const hasFlag = varParts.flagVariable !== undefined;
          apiData[getIndustryLikeId(selectedIndustryId)].forEach((varData) => {
            if (Object.keys(varData).includes(statVarId)) {
              const flagValue = hasFlag
                ? varData[varParts.flagVariable!.alias]
                : undefined;
              if (hasFlag && flagValue !== null && flagValue !== '') {
                setApiData(
                  selectedIndustryId,
                  apiGeoRecord.data,
                  {
                    variableId: statVarId,
                    value: Nambers.naNamber(`Suppressed (${flagValue})`),
                  },
                  moeVarId !== undefined
                    ? { variableId: moeVarId, value: Nambers.naNamber() }
                    : undefined
                );
              } else {
                const statValue = varData[varParts.statVariable.alias];
                let moeValue: Namber | undefined;
                if (moeVarId !== undefined) {
                  const moe = varData[varParts.moeVariable!.alias];
                  // Translate the value here from a number looking value to annotation
                  if (moe) {
                    moeValue = Namber(translateToAnnotation(moe));
                  } else {
                    moeValue = Nambers.naNamber();
                  }
                }
                if (isNumberLike(statValue)) {
                  setApiData(
                    selectedIndustryId,
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
                    selectedIndustryId,
                    apiGeoRecord.data,
                    { variableId: statVarId, value: Nambers.naNamber() },
                    moeVarId !== undefined
                      ? { variableId: moeVarId, value: Nambers.naNamber() }
                      : undefined
                  );
                }
              }
            }
          });
        }
      });
    });
  }

  public executeDataAPIQueriesForDataVariablePartition(
    industryIdList: string[],
    mapTigerIds: boolean,
    dataVarPart: DataVariablePartition,
    geoType: GeoType,
    partitionGeos: DetailedGeo[]
  ): Promise<CensusApiGeoRecord[]> {
    const apiQueries: Promise<CensusApiGeoRecord>[] = [];
    const paramsExecute: DataQueryParameters = {
      industryIdList,
      dataVarPartition: dataVarPart,
      geoType,
      queryField: '',
      geoAttributes: {},
      apiFields: [],
      geoFields: [],
      geoIds: [],
      includeGeoIds: undefined,
    };
    // specific handling for places
    if (mapTigerIds) {
      const nonMcdGeoIds: string[] = [];
      const nonMcdPartition: DetailedGeo[] = [];
      const mcdGeoIds: string[] = [];
      const mcdPartition: DetailedGeo[] = [];

      partitionGeos.forEach((geo) => {
        // Check if a mapping exists - else treat it as a regular geo - this allows us to make the mapping file smaller
        const geoMapping = MetadataService.getPlaceMappingForGeoId(
          geo.attributes[geoType.GeoIdField] as string
        );
        if (geoMapping) {
          // Removed the "A-" prefix from state, county from Excel file - not needed.
          // Also removed the DATA_API_GEOID column because it is the same as the key
          const dataAPIGeoId = geo.attributes[geoType.GeoIdField];
          // Check if we dealing with places and if so figure do we want places or MCD's (Minor Civil Divisions)
          // If the county field is empty, then this is a regular place
          if (
            geoMapping.COUNTY === '' ||
            typeof geoMapping.COUNTY === 'undefined'
          ) {
            nonMcdGeoIds.push(geo.attributes[geoType.TigerIdField] as string);
            nonMcdPartition.push(geo);
          } else {
            if (typeof geoMapping.COUNTY !== 'undefined') {
              geo.attributes.COUNTY = geoMapping.COUNTY;
            }
            mcdGeoIds.push(dataAPIGeoId as string);
            mcdPartition.push(geo);
          }
        } else {
          nonMcdGeoIds.push(geo.attributes[geoType.TigerIdField] as string);
          nonMcdPartition.push(geo);
        }
      });

      if (nonMcdGeoIds.length > 0) {
        paramsExecute.queryField = geoType.DataAPIIdField;
        paramsExecute.geoAttributes = nonMcdPartition[0].attributes;
        paramsExecute.apiFields = createOutFields(
          ...(geoType.DataAPIPartitionFields || [])
        );
        paramsExecute.geoFields = createOutFields(
          ...(geoType.TigerPartitionFields || [])
        );
        paramsExecute.geoIds = nonMcdGeoIds;
        paramsExecute.includeGeoIds = undefined;
        const geoResult1 =
          this.executeDataAPIQueryForDataVariablePartition(paramsExecute);
        apiQueries.push(geoResult1);
      }
      if (mcdGeoIds.length > 0) {
        paramsExecute.queryField = 'county subdivision';
        paramsExecute.geoAttributes = mcdPartition[0].attributes;
        paramsExecute.apiFields = createOutFields('state');
        paramsExecute.geoFields = createOutFields('STATE');
        paramsExecute.geoIds = ['*'];
        paramsExecute.includeGeoIds = mcdGeoIds;
        const geoResult2 =
          this.executeDataAPIQueryForDataVariablePartition(paramsExecute);
        apiQueries.push(geoResult2);
      }
    } else {
      const geoIds = CensusFetcher.getGeoIDs(
        partitionGeos,
        dataVarPart,
        geoType
      );
      paramsExecute.queryField = geoType.DataAPIIdField;
      paramsExecute.geoAttributes = partitionGeos[0].attributes;
      paramsExecute.apiFields = createOutFields(
        ...(geoType.DataAPIPartitionFields || [])
      );
      paramsExecute.geoFields = createOutFields(
        ...(geoType.TigerPartitionFields || [])
      );
      paramsExecute.geoIds =
        typeof geoIds === 'undefined' ? [] : geoIds.split(',');
      paramsExecute.includeGeoIds = undefined;
      const geoResult3 =
        this.executeDataAPIQueryForDataVariablePartition(paramsExecute);
      apiQueries.push(geoResult3);
    }
    return Promise.all(apiQueries);
  }

  private static getGeoIDs(
    partition: DetailedGeo[],
    dataVarPart: DataVariablePartition,
    geoType: GeoType
  ): string | undefined {
    let geoIds;
    // for intl trade data map fips code for state to postal abbreviations
    // ex state=06 to state = "CA"
    if (dataVarPart.mapStateIds[0] && geoType.MapStateId) {
      partition.forEach((feature) => {
        geoIds = MetadataService.getStatePostalCode(
          feature.attributes[geoType.TigerIdField] as string
        );
      });
    } else {
      // Fix for CBDI-814 - The props of partition obj that's passed into this method
      // gets assigned the values below which causes the below checks to fail on subsequent
      // calls to this method.
      const clonedPartition = JSON.parse(
        JSON.stringify(partition)
      ) as DetailedGeo[];
      geoIds = clonedPartition
        .map((feature) => {
          // Fix for CBDI-383, not pretty - we need a better way to handle this
          if (
            geoType.ID === 'nation' &&
            dataVarPart.apiUrl.includes('/intltrade')
          ) {
            return '';
          }

          if (
            geoType.ID === 'nation' &&
            dataVarPart.apiUrl.indexOf('/acs5') === -1
          ) {
            feature.id = '00';

            feature.attributes.GEOID = '00';

            feature.attributes[geoType.TigerIdField] = '00';
          }

          // Fix for US not appearing for Bug 3823: No US bar shown in Geo Comparison bar chart for NES 2018 (and)
          // test Business Annual => Revenue per nonemployer
          if (
            geoType.ID === 'nation' &&
            (dataVarPart.apiUrl.indexOf('/2018/nonemp') > -1 ||
              dataVarPart.apiUrl.indexOf('/2018/cbp') > -1 ||
              dataVarPart.apiUrl.indexOf('/2017/cbp') > -1 ||
              dataVarPart.apiUrl.indexOf('/2017/abscs') > -1 ||
              dataVarPart.apiUrl.indexOf('/2017/ecnbasic') > -1)
          ) {
            feature.id = '1';

            feature.attributes.GEOID = '1';

            feature.attributes[geoType.TigerIdField] = '1';
          }
          return feature.attributes[geoType.TigerIdField];
        })
        .join(',');
    }
    return geoIds;
  }

  private executeDataAPIQueryForDataVariablePartition(
    params: DataQueryParameters
  ): Promise<CensusApiGeoRecord> {
    const {
      industryIdList,
      dataVarPartition,
      queryField,
      geoAttributes,
      geoType,
      apiFields,
      geoFields,
      geoIds,
      includeGeoIds,
    } = params;

    let inClause;
    if (
      geoFields &&
      geoFields.length > 0 &&
      geoFields[0] &&
      geoFields[0] !== ''
    ) {
      inClause = geoFields
        .map((field, index) => `${apiFields[index]}:${geoAttributes[field]}`)
        .join(' ');
    }

    // partition request in chunks of 50 data variables.
    const paramsMergeVars = dataVarPartition.variableParts.reduce(
      (agg, varPart) => {
        agg.variableIds.push(varPart.statVariable.name);
        if (varPart.moeVariable !== undefined) {
          agg.moeVariables.push(varPart.moeVariable.name);
        }
        if (varPart.flagVariable !== undefined) {
          agg.variableFlags.push(varPart.flagVariable.name);
        }
        return agg;
      },
      {
        variableIds: [],
        moeVariables: [],
        variableFlags: [],
      } as {
        variableIds: string[];
        moeVariables: string[];
        variableFlags: string[];
      }
    );
    const selectColumns = CensusFetcher.mergeDataVars(paramsMergeVars);
    // remove duplicates
    const colsUnique = selectColumns.filter(
      (item, pos) => selectColumns.indexOf(item) === pos
    );
    const duplicates = selectColumns.length !== colsUnique.length;

    // TODO - Read this limit from config
    const maxLimit = 50;
    // const maxLimit = 1;
    const columnPartitions = chunk(colsUnique, maxLimit);

    // form the final api url with parameters.
    const paramsApiUrl: ApiUrlParameters = {
      dataVarPartition,
      industryIdList,
    };
    const apiUrl = CensusFetcher.getApiUrl(paramsApiUrl);

    let errMsg = 'Experiencing delay while fetching data for ';
    if (typeof geoIds === 'object' && geoIds.length > 1) {
      errMsg +=
        geoType.DataAPIIdField === 'County'
          ? 'Counties'
          : `${geoType.DataAPIIdField}s`;
    } else {
      errMsg += geoType.DataAPIIdField;
    }

    const paramsPopQueryList: DataAPIQueryParameters = {
      apiUrl,
      columnPartitions,
      queryField,
      geoIds,
      inClause,
      geoFormat: dataVarPartition.geoFormat,
      errMsg,
    };

    const defList =
      this.executeDataAPIQueryForColumnPartitions(paramsPopQueryList);
    return Promise.all(defList).then((results) => {
      const mergedResults = ColumnPartitionMerger.mergeColumnPartitions(
        results,
        colsUnique
      );
      const paramsFiltered: MergeParameters = {
        dataVarPartition,
        mergedResults,
        duplicates,
        selectColumns,
        includeGeoIds,
        includePlaces: !!(geoType.ID === 'place' && includeGeoIds),
      };

      const filteredResults =
        APIRowToObjectConverter.apiRowToDataObject(paramsFiltered);

      const paramsDataGeoInd = {
        geoType,
        filteredResults,
        dataVarPartition,
        industryIdList,
      };

      return CensusFetcher.getDataByGeoAndIndustry(paramsDataGeoInd);
    });
  }

  // used by _executeDataAPIQuery
  public static mergeDataVars(params: {
    variableIds: string[];
    moeVariables: string[];
    variableFlags: string[];
  }): string[] {
    const { variableIds, moeVariables, variableFlags } = params;
    const selectColumns: string[] = [];

    // Push any truth-y value into the select columns array
    selectColumns.push(...variableIds.filter((id) => id));
    selectColumns.push(...variableFlags.filter((flag) => flag && flag !== ''));
    selectColumns.push(...moeVariables.filter((moe) => moe && moe !== ''));

    return selectColumns;
  }

  private static getApiUrl(params: ApiUrlParameters): string {
    const { dataVarPartition, industryIdList } = params;
    let url = dataVarPartition.apiUrl;
    const sectorField = dataVarPartition.paramInd;
    if (dataVarPartition.paramInd && industryIdList) {
      industryIdList.forEach((industryId) => {
        url = `${url}&${sectorField}=${industryId}`;
      });
    }
    if (dataVarPartition.raceGroups) {
      // have a seperate url param such that "&RACEGROUP=20&RACEGROUP=30"
      const raceGrps = dataVarPartition.raceGroups;
      raceGrps.forEach((raceGroup) => {
        url = `${url}&RACE_GROUP=${raceGroup}`;
      });
    }
    if (dataVarPartition.sexGroups) {
      const gender = dataVarPartition.sexGroups.join('&');
      url = `${url}&${gender}`;
    }
    if (dataVarPartition.vetGroups) {
      const vet = dataVarPartition.vetGroups.join('&');
      url = `${url}&${vet}`;
    }
    return url;
  }

  private executeDataAPIQueryForColumnPartitions(
    params: DataAPIQueryParameters
  ): Promise<CensusAPIDataResult>[] {
    const {
      apiUrl,
      columnPartitions,
      queryField,
      geoIds,
      inClause,
      geoFormat,
      errMsg,
    } = params;

    return columnPartitions.map((columns) => {
      const fetch = this.clientUtils.fetchData(
        apiUrl,
        columns,
        queryField,
        geoIds,
        inClause,
        geoFormat
      ) as Promise<CensusAPIDataResult>;

      // return deferred;
      fetch.catch(() => {
        LogUtils.publishUserMessage(errMsg, 'error');
      });
      return fetch;
    });
  }

  private static getDataByGeoAndIndustry(
    params: GeoAndIndustryParameters
  ): CensusApiGeoRecord {
    const { geoType, filteredResults, dataVarPartition, industryIdList } =
      params;

    /* jshint sub: true */
    const dataFIPSFields = createOutFields(...geoType.DataAPIFIPSFields);
    const tigerFIPSFields = createOutFields(...geoType.TigerFIPSFields);
    // collect data by geos
    const dataByGeo = {} as {
      [geoKey: string]: Record<string, CensusAPIDataObject[]>;
    };
    filteredResults.forEach((row) => {
      let geoName = '';
      if (geoType.ID === 'nation') {
        geoName = geoType.ID;
      } else {
        /* jshint loopfunc: true */
        dataFIPSFields.forEach((field, fldIdx) => {
          if (dataVarPartition.mapStateIds[0]) {
            const stateCode = MetadataService.getStateFipsCode(
              row[field.toUpperCase()]!
            );
            geoName = `${geoName + tigerFIPSFields[fldIdx]}=${stateCode}`;
          } else {
            geoName = `${geoName + tigerFIPSFields[fldIdx]}=${row[field]}`;
          }
        });
      }
      if (!dataByGeo[geoName]) {
        dataByGeo[geoName] = {};
        dataByGeo[geoName][NO_INDUSTRY_ID] = [];
        industryIdList.forEach((selectedIndustryId) => {
          dataByGeo[geoName][getIndustryLikeId(selectedIndustryId)] = [];
        });
      }
      if (dataVarPartition.paramInd) {
        const selectedIndustryId = row[dataVarPartition.paramInd];
        dataByGeo[geoName][getIndustryLikeId(selectedIndustryId)].push(row);
      } else {
        dataByGeo[geoName][NO_INDUSTRY_ID].push(row);
      }
    });

    // This was a real funky return type -- it's an object with
    // keys like "STATE=27COUNTY=001" and an array value.  However,
    // the array is always length zero and there are additional
    // properties 'nonsector' and the sectorName that are arrays
    // as well
    //
    // We will assume the old initializer "dataByGeo[geoName] = [];"
    // was a typo and it should be initialized with an empty object, {}.
    return dataByGeo;
  }
}
