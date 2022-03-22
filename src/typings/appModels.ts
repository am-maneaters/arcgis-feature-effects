import Geometry from 'esri/geometry/Geometry';
import Polygon from 'esri/geometry/Polygon';
import {
  DataVariable,
  GeoType,
  GeoTypeVintageId,
  MappableGeoType,
  StandardIndustry,
} from './metadataModels';
import { Namber } from '../util/namber';

// Generic Utility Types
export type IndexedMap<T> = Record<string, T>;

export type CBBView = 'map' | 'report' | 'regionreport';
/**
 * A generic DTO that is generated within the app as opposed to one that is read from metadata file or application
 * configuration. Most of these will be generated as a result of reading a record/feature from ArcGIS but we want
 * to get away from relying on JS API's Graphic object (geometry and attributes) to the extent possible and have
 * the attributes that are of interest to CBB directly on the DTO object itself.
 */
export type CBBFeature = Record<string, unknown>;

/**
 * A CBB DTO object that has geometry in addition to other attributes. The rationale of having a separate DTO as
 * opposed to having geometry as one of the attributes on CBBFeature type above itself is to make the intent
 * clear and avoid having to carrying geometry unnecessarily.
 */
export type CBBGeometricFeature = CBBFeature & { geometry: Geometry };

/**
 * A type that resemebles ArcGIS Graphic object. This is just a convenience and may be removed if we find it unnecessary.
 */
export type GraphicLike = CBBFeature & {
  attributes: Record<string, unknown>;
  geometry?: Geometry;
};

/**
 * A lightweight geography object that is meant to be used in most of the application where details
 * such as partitions, endpoints, etc. may not be needed.
 */
export type BaseGeo = CBBFeature & {
  // TODO: Change the id field to uppercase to match the other ID's we are using
  // Deferring this change until all controllers have been ported to TS
  id: string;
  name: string;
  geoType: GeoType;
};

/**
 * Extension of BaseGeo object that includes geometry. This is meant to be used when displaying maps or regions etc.
 */
export type BaseGeoWithGeometry = CBBGeometricFeature & BaseGeo;

/**
 * Extension of BaseGeo object that includes attributes property. This is meant to be used within DataService to interact with data API.
 * The attributes property will contain details like partitions, endpoints etc. as defined in the MappableGeoType interface.
 * This structure will be kept until data service implementation is complete at which point we will lift everything up from
 * attributes property directly onto the DetailedGeo type so it more closely aligns with CBBFeature type.
 */
export type DetailedGeo = BaseGeo & {
  attributes: Record<string, unknown>;
};

/**
 * Extension of BaseGeo object that includes attributes property. This is meant to be used within DataService to interact with data API.
 * The attributes property will contain details like partitions, endpoints etc. as defined in the MappableGeoType interface.
 * This structure will be kept until data service implementation is complete at which point we will lift everything up from
 * attributes property directly onto the DetailedGeo type so it more closely aligns with CBBFeature type.
 */
export type DetailedGeoWithGeometry = DetailedGeo & CBBGeometricFeature;

/**
 * Geography partitions represent how census data API allows access to their data. For example county records can only be
 * queried by state and tract records can only be queried by state and county. In this case when the area of interest for CBB
 * spans these boundaries, we have to break out inputs to align with those.
 */
export type GeographyPartitions = DetailedGeo[][];

/**
 * A map of geo type Id to the geographic partitions for that type.
 * Needed because regions in RAE can have multiple types of geographies.
 */
export type GeographyPartitionsMap = Record<string, GeographyPartitions>;

// Industry related models
export const NO_INDUSTRY_ID = '_NO_INDUSTRY_';

export const CLUSTER_INDUSTRY_ID = '_INDUSTRY_CLUSTER_';

export type StandardIndustryNotNAICS = StandardIndustry & {
  isNaicsIndustry: 'NO';
};
export type BaseIndustry = {
  ID: string;
  Name: string;
  NAICSID: string;
  NAICSParentID: string;
  NAICSName: string;
  NAICSLevel: number;
  isSynonym: boolean;
};

export type IndustryCoverage = {
  establishmentCount?: number;
  EWKS: boolean;
  CBP: boolean;
  NES: boolean;
  // SBO: boolean;
  // SBO has been replaced by ABS
  ABS: boolean;
  TRADE: boolean;
  AG: boolean;
  QWI: boolean;
  BLS: boolean;
};

export type NAICSIndustry = BaseIndustry & {
  isSynonym: false;
};

export type NAICSIndustrySynonym = BaseIndustry & {
  isSynonym: true;
};

export type IndustrySearchResult = NAICSIndustry | NAICSIndustrySynonym;

export type NAICSIndustryWithCoverage = NAICSIndustry & {
  coverage: IndustryCoverage;
};

export type MergedIndustryWithCoverage = NAICSIndustryWithCoverage &
  StandardIndustry & {
    isNaicsIndustry: 'YES';
  };

export type AmbientIndustry =
  | StandardIndustryNotNAICS
  | NAICSIndustryWithCoverage
  | MergedIndustryWithCoverage;

// Region related models
type RegionGeos = Record<string, BaseGeo[]>;

export type Region = {
  regionName: string;
  regionGeographies: RegionGeos;
};

// User uploaded attribute data related models
export type DataHeaders = string[];

export type DataRow = [string, ...number[]];

export type DataRows = DataRow[];

export type UploadedDataVariable = {
  ID: string;
  Name: string;
  round: number;
};

export type UserUploadedData = {
  attributeData: [DataHeaders, ...DataRow[]];
  dataVariables: UploadedDataVariable[];
  warnings?: number[];
};

export type UploadInfo = {
  uploadId: number;
  geoType: MappableGeoType;
};

// Types related to Data retrieval
/**
 * Input parameters to the data services. Call them XXXParameters to follow
 * the conventions in the esir/tasks/support namespace
 */
export type TabularParameters = {
  dataVariableList: DataVariable[];
  industryIdList: string[];
  geographiesMap: GeographyPartitionsMap;
  vintage: GeoTypeVintageId;
};

export type TimeSeriesParameters = {
  dataVariable: DataVariable;
  industryIdList: string[];
  geographiesMap: GeographyPartitionsMap;
};

export type GeographicComparisonParameters = {
  dataVariable: DataVariable;
  industryIdList: string[];
  geographiesMap: GeographyPartitionsMap;
  parentGeos: GeographyPartitionsMap;
  geoOrRegionName: string | null;
  vintage: GeoTypeVintageId;
};

export type GeographicRankingParameters = {
  dataVariable: DataVariable;
  industryIdList: string[];
  geographiesMap: GeographyPartitionsMap;
  selectedGeography: BaseGeo;
  resultCount: number;
  resultOrder: string; // Meant to be either 'ASCENDING' or 'DESCENDING'
  vintage: GeoTypeVintageId;
  geographyPerRequestLimit: number;
};

/**
 * Output parameters from the data services. Name these XXXResponse to follow
 * the conventions in the esri/tasks namespace
 */
export type DataRecord = { stat: Namber; moe?: Namber };

export type IndustryMap<T extends Namber | DataRecord> = {
  [industryId: string]: T;
};

export type VariableMap<T extends Namber | DataRecord> = {
  [variableId: string]: IndustryMap<T>;
};

export type ClusteredVariableMap = {
  [variableId: string]: [IndustryMap<DataRecord>, DataRecord];
};

export type GeoRecord = {
  id: string;
  name: string;
  geoType: string;
  data: ClusteredVariableMap;
};

export type GeographyTypeToGeoRecordListMap = {
  [geoTypeId: string]: GeoRecord[];
};

export type TabularResult = GeographyTypeToGeoRecordListMap;

export type SummaryResult = ClusteredVariableMap;

export type TimeSeriesRecord = {
  vintage: GeoTypeVintageId;
  name: string;
  data: SummaryResult;
};

export type TimeSeriesResult = TimeSeriesRecord[];

export type GeographicComparisonResult = [SummaryResult, TabularResult];

// This is only meant to populate the peer geoglevels with values which can then be fed to the georanking chart
export type GeographicRankingResult = [GeoRecord[], GeoRecord[]];

// Types that extend metadata models
export type UserDefinedVariable = DataVariable & {
  uploadInfo: UploadInfo;
};

export type GenericVariable = DataVariable | UserDefinedVariable;

export function isVariableUserDefined(
  dataVariable: GenericVariable
): dataVariable is UserDefinedVariable {
  return (dataVariable as UserDefinedVariable).uploadInfo !== undefined;
}

// Classification related models
export type ClassificationMethod = 'equalInterval' | 'quantile';

export type ColorScheme = {
  naColor: string;
  excludedColor: string;
  colorRamp: string[];
};

export type SizeScheme = {
  naColor: string;
  naSize: number;
  excludedColor: string;
  excludedSize: number;
  markerColor: string;
  sizeRamp: number[];
};

export type VisualizationScheme = ColorScheme | SizeScheme;

export type ClassificationScheme = {
  numRanges: number;
  classificationMethod: ClassificationMethod;
};

export type PrimaryClassificationParameters = {
  classificationScheme: ClassificationScheme;
} & {
  visualizationSchemeId: string;
  visualizationScheme: ColorScheme;
};

export type SecondaryClassificationParameters = {
  classificationScheme: ClassificationScheme;
} & {
  visualizationSchemeId: string;
  visualizationScheme: SizeScheme;
};

// Download related models
export type MapDataDownloadFormat = 'csv' | 'xlsx' | 'shp';
export const SHAPE_COLUMN = 'SHAPE';
export type DownloadAttributeCell = string | number | undefined;
export type DownloadDataCell = DownloadAttributeCell | Polygon;
export type DownloadDataRow = DownloadDataCell[];
export type DownloadComponent = {
  sheetOrFileName: string;
  headers: string[];
  data: DownloadDataRow[];
};
