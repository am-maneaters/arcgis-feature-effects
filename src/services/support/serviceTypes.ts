import {
  DetailedGeo,
  GeographyPartitions,
  VariableMap,
} from '../../typings/appModels';
import {
  DataVariable,
  GeoTypeVintageId,
  GeoType,
  ProgramSource,
  VarParts,
} from '../../typings/metadataModels';

import { Namber } from '../../util/namber';

/**
 * Types for data variable partitioner
 */
export type DataVariablePartition = {
  apiUrl: string;
  mapTigerIds: boolean[];
  mapStateIds: boolean[];
  dataSource: ProgramSource;
  geoFormat?: string;

  variableParts: VarParts[];

  // This gets passed into queryUtils.createInSQLQuery, so must match that type
  paramInd?: string;

  // These three arrays are used in the internal _getApiUrl method in the census fetcher
  raceGroups?: number[];
  sexGroups?: string[];
  vetGroups?: string[];
};

export type DataPartitionParameters = {
  geoTypeId: string;
  vintage: GeoTypeVintageId;
  dataVariableList: DataVariable[];
};

export type SingleDataPartitionParameters = {
  geoTypeId: string;
  vintage?: string;
  dataVariable: DataVariable;
};
export type VarIdsAndAliases = {
  varIds: string[];
  varAliases: string[];
  moeIds: string[];
  moeIdAliases: string[];
};

export type TabularDefinitionsParameters = {
  allPartitions: GeographyPartitions;
  industryIdList: string[];
  geoType: GeoType;
  dataVarPartition: Record<string, DataVariablePartition>;
};

/**
 * Types for the data fetchers
 */
export type FetchDataParameters = {
  industryIdList: string[];
  geoType: GeoType;
  dataVarPart: DataVariablePartition;
  partition: DetailedGeo[];
};

/**
 * Types for data fetchers
 */
export type ApiRecord = {
  id: string;
  name: string;
  // geoType: GeoType;
  geoType: string;
  data: VariableMap<Namber>;
};

export type GeographyTypeToApiRecordListMap = {
  [geoTypeId: string]: ApiRecord[];
};
