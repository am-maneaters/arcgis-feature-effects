import { GeoType, VarParts } from '../../typings/metadataModels';
import { DataVariablePartition } from './serviceTypes';

export type CensusAPIHeaderRow = string[];
export type CensusAPIDataElement = string | null | undefined;
export type CensusAPIDataRow = CensusAPIDataElement[];
export type CensusAPIDataObject = Record<string, CensusAPIDataElement>;
export type CensusAPIDataResult = [CensusAPIHeaderRow, ...CensusAPIDataRow[]];

export type CensusAPIResultColumnInfo = {
  idColumnIndexes: number[];
  idColumnNames: string[];
  dataColumnIndexes: number[];
  dataColumnNames: string[];
};

export type CensusAPIDataRowComponents = {
  idValues: CensusAPIDataElement[];
  dataValues: CensusAPIDataElement[];
};

export type CensusAPIDataRowComponentsMap = {
  [k: string]: CensusAPIDataRowComponents;
};

export type CensusAPIParsedResult = {
  idColumnNames: string[];
  dataColumnNames: string[];
  rows: CensusAPIDataRowComponentsMap;
};

export type CensusApiGeoRecord = {
  [geoKey: string]: Record<string, CensusAPIDataObject[]>;
};

export type GeoAndIndustryParameters = {
  geoType: GeoType;
  filteredResults: CensusAPIDataObject[];
  dataVarPartition: DataVariablePartition;
  industryIdList: string[];
};

// Most properties copied from DataVariablePartition
export type FilterDataResultsParameters = {
  variableParts: VarParts[];
  includeGeoIds?: string[]; // Only used if includePlaces is true
  includePlaces: boolean;
  mergedResults: CensusAPIDataResult;
};

export type FilterParameters = {
  mergedResults: CensusAPIDataResult;
  dataVarPartition: DataVariablePartition;
};

export type MergeParameters = {
  dataVarPartition: DataVariablePartition;
  mergedResults: CensusAPIDataResult;
  duplicates: boolean;
  selectColumns: string[];
  includeGeoIds: string[] | undefined;
  includePlaces: boolean;
};

export type DataAPIQueryParameters = {
  apiUrl: string;
  columnPartitions: string[][];
  queryField: string;
  geoIds: string[];
  inClause: string | undefined;
  geoFormat?: string;
  errMsg: string;
};

export type ApiUrlParameters = {
  industryIdList: string[];
  dataVarPartition: DataVariablePartition;
};

export type DataQueryParameters = {
  industryIdList: string[];
  dataVarPartition: DataVariablePartition;
  geoType: GeoType;
  queryField: string;
  geoAttributes: Record<string, unknown>;
  apiFields: string[];
  geoFields: string[];
  geoIds: string[];
  includeGeoIds: string[] | undefined;
};
