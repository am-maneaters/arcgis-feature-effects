import { NAICSIndustryWithCoverage, BaseGeo, CBBView } from './appModels';
import { DataVariable, MappableGeoType, ReportType } from './metadataModels';

export type BaseBoomarkHash = {
  industry0?: string;
  industries: string[];
  clusterName: string;
  view: CBBView;
};

export type ReportHash = {
  reportType: string;
  sectionsOff?: string;
};

export type SingleGeoBookmarkHash = BaseBoomarkHash & {
  geoType: string;
};

export type RegionDefinitionHash = {
  dynamicGeos?: Record<string, string[]>;
  dynHeader?: string;
};

export type MapBookmarkHash = SingleGeoBookmarkHash &
  RegionDefinitionHash & {
    view: 'map';
    dataVariable: string;
    dataVariable1?: string;
    dashboardVars?: string[];
    centerX: string;
    centerY: string;
    level: string;
    geoId?: string;
  };

export type ReportBookmarkHash = SingleGeoBookmarkHash &
  ReportHash & {
    view: 'report';
    geoId: string;
  };

export type RegionReportBookmarkHash = BaseBoomarkHash &
  ReportHash &
  RegionDefinitionHash & {
    view: 'regionreport';
  };

export type BookmarkHash =
  | ReportBookmarkHash
  | MapBookmarkHash
  | RegionReportBookmarkHash;

export type BookmarkKeys =
  | keyof MapBookmarkHash
  | keyof ReportBookmarkHash
  | keyof RegionReportBookmarkHash;

export type SyncValidationResult = {
  view?: CBBView;
  dataVariable?: DataVariable;
  dataVariable1?: DataVariable;
  dashboardVars?: DataVariable[];
  geoType?: MappableGeoType;
  dynamicGeoTypes?: MappableGeoType[];
  reportType?: ReportType;
  sectionsOff?: string | undefined;

  geoId?: string;
  dynHeader?: string;
  industry0?: string;
  industries?: string[] | NAICSIndustryWithCoverage[];
  clusterName?: string;

  centerX: number;
  centerY: number;
  level: number;
};

export type AsyncValidationResult = {
  // industry?: NAICSIndustryWithCoverage;
  industries?: NAICSIndustryWithCoverage[];
  geography?: BaseGeo;
  dynamicGeographies?: Record<string, BaseGeo[]>;
  hasError?: boolean;
};

export type BookmarkResolutionSuccessfulEvent = SyncValidationResult &
  AsyncValidationResult;

export type BookmarkProcessedParams =
  | BookmarkResolutionSuccessfulEvent
  | { hasError: true };

export type DataLayerPayload = {
  Edition: string;
  GeoSelection_ID: string;
  GeoSelection_Name: string;
  GeoTypeSelection_ID: string;
  GeoTypeSelection_Name: string;
  IndustrySelection_ID?: string;
  IndustrySelection_Name?: string;
  MapExtent: string;
  MapVariableSelection_ID: string;
  MapVariableSelection_Name: string;
  Region_Name?: string;
  ZoomLevel: string | number;
};

export enum HashKey {
  DASHBOARD_VARS_KEY = 'dashboardVars',
  INDUSTRIES_KEY = 'industries',
}

export enum Separator {
  NAICSID = '*',
  DEFAULT = '-',
  OBSOLETE = ',',
}
