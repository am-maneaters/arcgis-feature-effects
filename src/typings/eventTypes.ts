import type {
  ClickEvent,
  DrawEvent,
  DrawToolType,
  MapExtentChangedParams,
} from '../controllers/base/baseMapController';
import type { DataVariableInfo } from '../controllers/base/dataVariableSelectionController';
import type { DashboardVariablesInfo } from '../controllers/impl/dashboardDataVariablesSelectionControllerImpl';
import type { FilterVariablesInfo } from '../controllers/impl/filterVariablesSelectionControllerImpl';
import type { SplashPageParams } from '../controllers/impl/splashPageControllerImpl';
import type { BookmarkResolutionSuccessfulEvent } from '../typings/bookmark';
import type {
  BaseGeo,
  NAICSIndustryWithCoverage,
  PrimaryClassificationParameters,
  Region,
  SecondaryClassificationParameters,
  UploadInfo,
  UserUploadedData,
} from './appModels';
import type {
  DataVariable,
  MappableGeoType,
  ReportType,
} from './metadataModels';

export type StateEventName =
  | 'appInitialized'
  | 'splashPageClosed'
  | 'industryChanged'
  | 'geoTypeChanged'
  | 'geographySelected'
  | 'geographiesSelected'
  | 'primaryDataVariableChanged'
  | 'secondaryDataVariableChanged'
  | 'secondaryDataVariableRemoved'
  | 'filterVariablesChanged'
  | 'dashboardVariablesChanged'
  | 'dashboardVariablePromoted'
  | 'mapExtentChanged'
  | 'classificationParamsChanged'
  | 'regionEditingStarted'
  | 'regionEditingCompleted'
  | 'userDataUploaded'
  | 'appTitleClicked'
  | 'userRegionUploaded'
  | 'enableDrawMode'
  | 'disableDrawMode'
  | 'finishedDrawing'
  | 'clearDrawnFeatures'
  | 'reportViewChanged';

export type OtherEventName =
  | 'updateReportType'
  | 'reportConfigChanged'
  | 'clearRegionOverlap'
  | 'zoomToRegionOverlap'
  | 'filterVariablesCanceled'
  | 'filterVariablesUpdated'
  | 'reportConfigChangeRequested'
  | 'editSecondaryVariable'
  | 'mapUpdateCompleted'
  | 'legendLayerRefreshed'
  | 'mapUpdateProgress'
  | 'mapUpdateStarted'
  | 'reportConfigInitialSetUp'
  | 'processFileUploadResults';

export type InternalEvent =
  | 'syncApp'
  | 'error'
  | 'reportRequested'
  | 'regionReportRequested'
  | 'computeMapExtent'
  | 'computeGeoTypeVisibility'
  | 'computePrimaryDataVariableInfo'
  | 'computeSecondaryDataVariableInfo'
  | 'computeDashboardVariablesInfo'
  | 'computeMapPartitions'
  | 'computeTablePartitions'
  | 'computeFilterVariablesInfo'
  | 'computeThematicData';

export type EventName = StateEventName | OtherEventName;

export interface InternalEventParams extends Record<string, unknown[]> {
  reportRequested: [BookmarkResolutionSuccessfulEvent];
  regionReportRequested: [BookmarkResolutionSuccessfulEvent];
}

export interface EventParams extends Record<EventName, unknown[]> {
  appInitialized: [];
  reportViewChanged: [ReportType];

  reportConfigChanged: [string];

  splashPageClosed: [SplashPageParams];

  industryChanged: [NAICSIndustryWithCoverage[], string?];
  geoTypeChanged: [MappableGeoType];
  geographySelected: [unknown, BaseGeo, ClickEvent?];
  geographiesSelected: [unknown, BaseGeo[], DrawEvent?];
  primaryDataVariableChanged: [DataVariableInfo, MappableGeoType];
  secondaryDataVariableChanged: [DataVariableInfo, MappableGeoType];
  dashboardVariablesChanged: [DashboardVariablesInfo];
  dashboardVariablePromoted: [DataVariable];
  filterVariablesChanged: [FilterVariablesInfo?];
  mapExtentChanged: [MapExtentChangedParams?];
  classificationParamsChanged: [
    PrimaryClassificationParameters,
    SecondaryClassificationParameters
  ];
  userDataUploaded: [UploadInfo];
  userRegionUploaded: [UserUploadedData];
  regionEditingStarted: [];
  regionEditingCompleted: [Region];
  appTitleClicked: [];
  enableDrawMode: [DrawToolType];
  disableDrawMode: [];
  finishedDrawing: [];
}

export type FilterVariablesInfoComputedParams = {
  filterVariablesInfo: FilterVariablesInfo;
  hasError?: boolean;
};
