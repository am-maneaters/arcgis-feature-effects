import { ApiRecord, VarIdsAndAliases } from './serviceTypes';

import {
  CLUSTER_INDUSTRY_ID,
  NO_INDUSTRY_ID,
  ClusteredVariableMap,
  DataRecord,
  DetailedGeo,
  GeoRecord,
  VariableMap,
} from '../../typings/appModels';
import { APIVariable, GeoType } from '../../typings/metadataModels';

import * as Nambers from '../../util/namber';

import { Namber } from '../../util/namber';
import { isNumberLike, toNumber } from '../../util/dataUtils';

function isMoEApplicableForOperand(idsAndAliases: VarIdsAndAliases): boolean {
  return (
    idsAndAliases.moeIds.length > 0 &&
    idsAndAliases.varIds.length === idsAndAliases.moeIds.length
  );
}

export function getIndustryLikeId(
  selectedIndustryId: string | undefined | null
): string {
  if (
    selectedIndustryId === undefined ||
    selectedIndustryId === null ||
    selectedIndustryId === NO_INDUSTRY_ID
  ) {
    return NO_INDUSTRY_ID;
  }
  return `sector${selectedIndustryId}`;
}

export function getAPIVariableIdsAndAliases(
  dataVarSources: APIVariable[]
): VarIdsAndAliases {
  const initial: VarIdsAndAliases = {
    varIds: [],
    varAliases: [],
    moeIds: [],
    moeIdAliases: [],
  };
  return dataVarSources.reduce((agg, dataVarSource) => {
    agg.varIds.push(dataVarSource.variableParts.statVariable.name);
    agg.varAliases.push(dataVarSource.variableParts.statVariable.alias);
    if (dataVarSource.variableParts.moeVariable !== undefined) {
      agg.moeIds.push(dataVarSource.variableParts.moeVariable.name);
      agg.moeIdAliases.push(dataVarSource.variableParts.moeVariable.alias);
    }
    return agg;
  }, initial);
}

export function isMoENA(
  op1IdsAndAliases: VarIdsAndAliases,
  op2IdsAndAliases: VarIdsAndAliases
): boolean {
  const op1Applicable = isMoEApplicableForOperand(op1IdsAndAliases);
  const op2Applicable =
    op2IdsAndAliases.varIds.length > 0
      ? isMoEApplicableForOperand(op2IdsAndAliases)
      : true;
  return !(op1Applicable && op2Applicable);
}

export function getApiData(
  industryLikeId: string,
  variableId: string,
  apiData: VariableMap<Namber>
): Namber {
  if (
    apiData[variableId] === undefined ||
    apiData[variableId][industryLikeId] === undefined
  ) {
    return Namber('n/a');
  }
  return apiData[variableId][industryLikeId];
}

function setVarData(
  industryLikeId: string,
  apiData: VariableMap<Namber>,
  variableAlias: string,
  value: Namber
): void {
  // Set value for stat
  if (apiData[variableAlias] === undefined) {
    apiData[variableAlias] = {};
  }

  apiData[variableAlias][industryLikeId] = value;
}

export function setApiData(
  industryId: string,
  apiData: VariableMap<Namber>,
  stat: { variableId: string; value: Namber },
  moe?: { variableId: string; value: Namber }
): void {
  setVarData(industryId, apiData, stat.variableId, stat.value);
  if (moe !== undefined) {
    setVarData(industryId, apiData, moe.variableId, moe.value);
  }
}

export function setComputedData(
  clusterOrIndustryLikeId: string,
  geoRecordData: ClusteredVariableMap,
  variableId: string,
  stat: Namber,
  moe?: Namber
): void {
  if (geoRecordData[variableId] === undefined) {
    geoRecordData[variableId] = [{}, undefined as any];
  }
  const dataRecord: DataRecord = { stat };
  if (moe !== undefined) {
    dataRecord.moe = moe;
  }
  if (clusterOrIndustryLikeId === CLUSTER_INDUSTRY_ID) {
    geoRecordData[variableId][1] = dataRecord;
  } else {
    geoRecordData[variableId][0][clusterOrIndustryLikeId] = dataRecord;
  }
}

export function translateToAnnotation(moeVal: string): string {
  if (isNumberLike(moeVal)) {
    const numVal = toNumber(moeVal);
    switch (numVal) {
      case -999999999:
        return 'N';
      case -888888888:
        return 'X';
      case -666666666:
        return '-';
      case -555555555:
        return '*****';
      case -333333333:
        return '***';
      case -222222222:
        return '**';
      default:
        return moeVal;
    }
  }
  return moeVal;
}

export function scaleAndRound(
  value: Namber,
  scaleFactor = 1,
  roundTo = 0
): Namber {
  return Nambers.round(Nambers.mul(value, scaleFactor), roundTo);
}

export function createOutFields(...args: string[]): string[] {
  const outFields = args.flatMap((arg) =>
    arg.split(',').map((splitArg) => splitArg.trim())
  );
  // one-line distinct() function
  return outFields.filter((item, index, arr) => arr.indexOf(item) === index);
}

export function buildApiRecord(
  geoType: GeoType,
  feature: DetailedGeo
): ApiRecord {
  return {
    id: feature.id,
    name: feature.name,
    geoType: geoType.ID,
    data: {},
  };
}

export function buildGeoRecordFromApiRecord(
  geoType: GeoType,
  feature: ApiRecord
): GeoRecord {
  const { id, name } = feature;
  return {
    id,
    name,
    geoType: geoType.ID,
    data: {},
  };
}

/**
 * A fail function that returns a never type used to provide exhaustive type checks
 * @param message a message to display if the function is reachable
 * @returns never type; cannot be invoked
 */
export function fail(message?: string): never {
  throw new Error(message);
}
