import { APIService } from './apiService';

import {
  CLUSTER_INDUSTRY_ID,
  ClusteredVariableMap,
  DataRecord,
  GeographicRankingParameters,
  GeographicRankingResult,
  GeographicComparisonParameters,
  GeographicComparisonResult,
  GeoRecord,
  SummaryResult,
  TabularParameters,
  TabularResult,
  TimeSeriesParameters,
  TimeSeriesResult,
} from '../typings/appModels';
import { AppConfig } from '../typings/configModels';
import {
  AppMetadata,
  DataVariableGeoTypeVintage,
} from '../typings/metadataModels';
import { MetadataService } from './metadataService';

import * as Nambers from '../util/namber';

import { Namber } from '../util/namber';
import { Tabulator } from './tabulator/Tabulator';
import { Summarizer } from './tabulator/Summarizer';
import { GeographicComparisonTabulator } from './tabulator/GeographicComparisonTabulator';
import { GeographicRankingTabulator } from './tabulator/GeographicRankingTabulator';
import { TimeSeriesTabulator } from './tabulator/TimeSeriesTabulator';

export class DataService {
  constructor(
    readonly metadata: AppMetadata,
    readonly appConfig: AppConfig,
    readonly apiService: APIService
  ) {}

  public async getTabularData(
    params: TabularParameters
  ): Promise<TabularResult> {
    return new Tabulator(this.apiService).getTabularData(params);
  }

  public getSummarizedData(params: TabularParameters): Promise<SummaryResult> {
    return new Summarizer(this.apiService).getSummarizedData(params);
  }

  public getTimeSeriesData(
    params: TimeSeriesParameters
  ): Promise<TimeSeriesResult> {
    return new TimeSeriesTabulator(this.apiService).getTimeSeriesData(params);
  }

  public getGeographicComparisonData(
    params: GeographicComparisonParameters
  ): Promise<GeographicComparisonResult> {
    return new GeographicComparisonTabulator(
      this.apiService
    ).getGeographicComparisonData(params);
  }

  public getGeographicRankingData(
    params: GeographicRankingParameters // might need to make separate object for geo ranking
  ): Promise<GeographicRankingResult> {
    return new GeographicRankingTabulator(
      this.apiService
    ).getGeographicRankingData(params);
  }
}

// Common Utility Functions
export function getDataRecord(
  geoRecordData: ClusteredVariableMap,
  varGeoTypeVintage: DataVariableGeoTypeVintage,
  selectedIndustryId: string
): DataRecord {
  const { variableId } = varGeoTypeVintage;
  if (selectedIndustryId === CLUSTER_INDUSTRY_ID) {
    return geoRecordData[variableId][1];
  }
  const industryLikeId = MetadataService.getIndustryLikeIdForVGTV(
    varGeoTypeVintage,
    selectedIndustryId
  );
  return geoRecordData[variableId][0][industryLikeId];
}

export function findStat(dataRecord: DataRecord): number | undefined {
  const statValue = dataRecord.stat;
  if (Nambers.hasValue(statValue)) {
    return statValue.value;
  }
  return undefined;
}

export function findMoE(dataRecord: DataRecord): number | undefined {
  const moeValue = dataRecord.moe;
  if (moeValue !== undefined && Nambers.hasValue(moeValue)) {
    return moeValue.value;
  }
  return undefined;
}

export function findFeatureStat(
  feature: GeoRecord,
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): number | undefined {
  return varGeoTypeVintage
    ? findStat(
        getDataRecord(feature.data, varGeoTypeVintage, selectedIndustryId)
      )
    : undefined;
}

export function findFeatureStatAsNamber(
  feature: GeoRecord,
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): Namber {
  return varGeoTypeVintage
    ? getDataRecord(feature.data, varGeoTypeVintage, selectedIndustryId).stat
    : Nambers.naNamber();
}

export function findFeatureMoE(
  feature: GeoRecord,
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): number | undefined {
  return varGeoTypeVintage
    ? findMoE(
        getDataRecord(feature.data, varGeoTypeVintage, selectedIndustryId)
      )
    : undefined;
}

export function findFeatureMoEAsNamber(
  feature: GeoRecord,
  varGeoTypeVintage: DataVariableGeoTypeVintage | undefined,
  selectedIndustryId: string
): Namber | undefined {
  return varGeoTypeVintage
    ? getDataRecord(feature.data, varGeoTypeVintage, selectedIndustryId).moe
    : Nambers.naNamber();
}
