import {
  ClassificationMethod,
  ColorScheme,
  MapDataDownloadFormat,
  SizeScheme,
} from './appModels';
import { Tooltips } from './metadataModels';

// Service Configurations
export type DataAPIClientConfig = {
  urlLengthLimit: number;
  geographyPerRequestLimit: number;
  geoTypeReplacementsForPath: Record<string, string>;
};
export type IndustryServiceConfig = {};
export type GeographyServiceConfig = {};
export type DataServiceConfig = {};

// Controller Configurations
// Classification
export type ClassificationSchemeConfig = {
  classificationMethod: ClassificationMethod;
  label: string;
  isDefault: boolean;
};

export type ColorSchemeConfig = ColorScheme & {
  id: string;
  label: string;
  isDefault: boolean;
};

export type SizeSchemeConfig = SizeScheme & {
  id: string;
  label: string;
  isDefault: boolean;
};

// Map Contents
export type PredefinedLayer = {
  ID: string;
  Name: string;
  serviceUrl: string;
  PopUpTip: string;
  transparency: number;
};
export type MapContentsConfig = {
  defaultTransparency: number;
  predefinedMapLayers: PredefinedLayer[];
  maxAllowedFeatureCount: number;
  maxAllowedUploadSize: number;
  pointSymbol: unknown;
  lineSymbol: unknown;
  polygonSymbol: unknown;
};

// Controller configs
export type FilterSelectionControllerConfig = {
  maxFiltersAllowed: number;
};
export type GeoSearchControllerConfig = {
  searchMin: number;
};
export type IndustrySelectionControllerConfig = {
  allowIndustryClusters: boolean;
  maxSelectableIndustries?: number;
  naicsCodeSearchMin: number;
  naicsTextSearchMin: number;
  allowIndustrySearch: boolean;
  allowIndustryListBrowse: boolean;
  allowIndustryTreeBrowse: boolean;
  establishmentsLowPoint: number;
  industryDefinitionBaseUrl: string;
};
export type LegendControllerConfig = {
  maxAllowedRanges: number;
  primaryVarClassificationConfig: {
    classificationSchemes: ClassificationSchemeConfig[];
    colorSchemes: ColorSchemeConfig[];
  };
  secondaryVarClassificationConfig: {
    classificationSchemes: ClassificationSchemeConfig[];
    sizeSchemes: SizeSchemeConfig[];
  };
};
export type MapControllerConfig = {
  initialTransparency: 40;
  drawToolSymbol: unknown;
  downloadOptions: { label: string; format: MapDataDownloadFormat }[];
  mapContentsConfig: MapContentsConfig;
};
export type RegionPanelControllerConfig = {
  showGeographyEstimates: boolean;
  geoLimit: number;
};
export type ReportControllerConfig = {
  allIndustriesOption: 'leaf' | 'top';
  defaultReportType: 'summary' | 'detailed';
};
type IndustryRequired =
  | { requireIndustry: true }
  | { requireIndustry: false; defaultIndustryIds: string[] };
export type SplashPageControllerConfig = IndustryRequired & {
  hideReportButton: boolean;
};

// View Configurations
export type DashboardViewConfig = {
  showMargins: true;
};
export type LayoutViewConfig = {
  showSplashPage: boolean;
};
export type RegionViewConfig = {};
export type SplashPageViewConfig = {};
export type MapViewConfig = {
  name: string;
  label: string;
  thumbnailUrl: string;
  default: boolean;
}[];

export interface AppConfig {
  editionConfig: {
    title: string;
    editionPrefix: string;
    editionBodyClass: 'sbe' | 'coce';
  };

  mapConfig: {
    mapViewContainer: string;
  };

  dataAPIClientConfig: DataAPIClientConfig;
  dataServiceConfig: DataServiceConfig;
  geographyServiceConfig: GeographyServiceConfig;
  industryServiceConfig: IndustryServiceConfig;

  bookmarkConfig: {
    restoreFromBookmark: boolean;
    createBookmark: boolean;
  };

  filterSelectionControllerConfig: FilterSelectionControllerConfig;
  geoSearchControllerConfig: GeoSearchControllerConfig;
  industrySelectionControllerConfig: IndustrySelectionControllerConfig;
  legendControllerConfig: LegendControllerConfig;
  mapControllerConfig: MapControllerConfig;
  regionPanelControllerConfig?: RegionPanelControllerConfig;
  reportControllerConfig: ReportControllerConfig;
  splashPageControllerConfig: SplashPageControllerConfig;

  dashboardViewConfig: DashboardViewConfig;
  layoutViewConfig: LayoutViewConfig;
  regionViewConfig: RegionViewConfig;
  splashPageViewConfig: SplashPageViewConfig;
  mapViewConfig: MapViewConfig;
  tooltips: Tooltips;
}
