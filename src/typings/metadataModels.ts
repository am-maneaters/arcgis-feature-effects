export type PlaceMappingEntry = {
  COUNTY?: string;
  ACS_GEOID?: string;
};
export type PlaceMapping = {
  [k: string]: PlaceMappingEntry;
};

export type USState = {
  name: string;
  abbreviation: string;
  FIPS: string;
};

// Interface to tag metadata types with Names
export interface MetadataRecordWithName {
  Name: string;
}

// Base Record to associate to Excel
export type MetadataRecord = {
  row: number;
};

export type MetadataRecordWithID = MetadataRecord & {
  ID: string;
};

// Industries
export type IsNAICSIndustry = 'UNKNOWN' | 'YES' | 'NO';
export type StandardIndustry = MetadataRecordWithID & {
  Name: string;
  Image?: string;
  Image_Hover?: string;
  PopUpTip?: string;
  ParentID?: string;
  isNaicsIndustry: IsNAICSIndustry;
};

// Variable Categories
export type VariableCategory = MetadataRecordWithID & {
  Name: string;
  PopUpTip: string;
  ParentID?: string;
  UserMsg?: string;
};

// Data Variables
export type VarInfo = { name: string; alias: string };
export type VarParts = {
  statVariable: VarInfo;
  moeVariable?: VarInfo;
  flagVariable?: VarInfo;
};

export type OperandProcessor = 'IDENTITY' | 'SUM';
export type DataVariableProcessor = 'IDENTITY' | 'SUM' | 'RATIO' | 'PERCENT';
export type DataVariableDisplayProperties = {
  Round: number;
  UOM_Prefix: string;
  UOM_Suffix: string;
  Format_Number: boolean;
  ScaleFactor: number;
};
export type ProgramRef = {
  programId: string;
};

// Types ending in OTW is how metadata is stored in Excel file and is transmitted over-the-wire
// These types are then converted to those used within the app (in metadataService)
type DataVariableComponents = {
  Variable: string;
  URL_Parameters?: string;
  Sector_Field?: string;
  RACE_GROUP?: string;
  SEX?: string;
  VET_GROUP?: string;
};

// Geo Type Vintage
export type GeoTypeVintageId = 'current' | 't1' | 't2' | 't3' | 't4' | 't5';
export const CURRENT_VINTAGE = 'current' as GeoTypeVintageId;

export type GeoTypeVintageShell = {
  geoTypeId: string;
  vintageId: GeoTypeVintageId;
  variableId: string;
};

// GeoTypeVintage related types for over-the-wire transfer
export type DataVariableSourceOTW = ProgramRef & DataVariableComponents;
export type DataVariableOperandOTW = {
  sources: DataVariableSourceOTW[];
  operandProcessor: OperandProcessor;
};
export type DataVariableOperandsOTW = {
  operand1: DataVariableOperandOTW;
  operand2?: DataVariableOperandOTW;
  Processor: DataVariableProcessor;
};
export type DataVariableGeoTypeVintageOTW = DataVariableDisplayProperties &
  DataVariableOperandsOTW &
  GeoTypeVintageShell;

export type DataVariable = MetadataRecordWithID &
  DataVariableDisplayProperties & {
    // basic config
    ParentID?: string;
    Name: string;
    Display_Order: string;
    PopUpTip: string;
    // membership config
    Variable_Categories?: string[];
    Report_VariableGroups?: string[];
    // comparison config
    No_Geo_Comp_Msg: string;
    No_Time_Comp_Msg: string;
    // chart config
    ShowGeoChart: boolean;
    Chart_Range_Min?: number;
    Chart_Range_Max?: number;
    // industry cluster config
    DisableMultiIndustryCluster: boolean;
  };

// Programs
export type ProgramSource =
  | 'CENSUS_DATA_API'
  | 'ESRI_CONSUMER_DATA'
  | 'USER_UPLOADED_DATA';
export type FlagStrategy = 'PREFIX_S' | 'UNDERSCORE_F';
export type ReliabilityStrategy = 'ACS_MOE';
export type BaseProgram = MetadataRecordWithID & {
  Name: string;
  Program: string;
  Year: string;
  Dataset: string;
  API_URL: string;
  MapTigerId: boolean;
  MapStateId: boolean;
  ReliabilityStrategy?: ReliabilityStrategy;
  FlagStrategy?: FlagStrategy;
};
export type DataAPIProgram = BaseProgram & {
  Source: ProgramSource & 'CENSUS_DATA_API';
  GeoFormat: string;
};
export type EMCSProgram = BaseProgram & {
  Source: ProgramSource & 'ESRI_CONSUMER_DATA';
};
export type Program = DataAPIProgram | EMCSProgram;

// Combined attributes (remapped from Excel names to JS names)
export type BaseAPIVariable =
  // Details from Program
  {
    source: ProgramSource;
    programName: string;
    program: string;
    year: string;
    dataset: string;
    apiUrl: string;
    mapTigerId: boolean;
    mapStateId: boolean;
    reliabilityStrategy?: ReliabilityStrategy;
    flagStrategy?: FlagStrategy;
  } & {
    // Details from Variable
    // name: string;
    variableParts: VarParts;
    urlParameters?: string;
    sectorField?: string;
    raceGroup?: string;
    sexGroup?: string;
    vetGroup?: string;
  };
export type CensusAPIVariable = BaseAPIVariable & {
  source: ProgramSource & 'CENSUS_DATA_API';
  geoFormat: string;
};
export type EMCSVariable = BaseAPIVariable & {
  source: ProgramSource & 'ESRI_CONSUMER_DATA';
};
export type UserUploadedVariable = BaseAPIVariable & {
  source: ProgramSource & 'USER_UPLOADED_DATA';
  geoFormat: string;
};
export type APIVariable =
  | CensusAPIVariable
  | EMCSVariable
  | UserUploadedVariable;

export type DataVariableOperand = {
  sources: APIVariable[];
  operandProcessor: OperandProcessor;
};
export type DataVariableOperands = {
  operand1: DataVariableOperand;
  operand2?: DataVariableOperand;
  Processor: DataVariableProcessor;
};
export type DataVariableGeoTypeVintage =
  // GeoTypeVintage Properties
  GeoTypeVintageShell &
    // Display Properties
    DataVariableDisplayProperties &
    // Operands Properties
    DataVariableOperands & {
      // List of all years and datasets
      datasets: string[];
      years: string[];
    };

// Geo Types
export type ZoomLevelRange = {
  from: number;
  to: number;
};
export type DrawingProperties = {
  DisableBelow: number;
  ZoomLevels: ZoomLevelRange[];
} & (
  | { AllowLabels: false }
  | {
      AllowLabels: true;
      DisableLabelsBelow: number;
      LabelZoomLevels: ZoomLevelRange[];
      LabelFontSize: number[];
      LabelExpression: string;
    }
);

// The special '00' value is only used in the censusFetcher to mark data from the acs5 service endpoint
// Added '1' to account for nonemp 2018
// export type GeoTypeId = 'nation' | 'zcta' | 'state' | 'county' | 'place' | 'tract' | '00' | '1';

export type GeoType = MetadataRecordWithID & {
  // Basic fields -- constrain the ID for GeoTypes
  ID: string;
  Name: string;
  // Fields for interaction with Data API
  GeoIdField: string;
  DisplayField: string;
  StateField?: string;
  TigerIdField: string;
  TigerPartitionFields?: string[];
  TigerFIPSFields: string[];
  DataAPIIdField: string;
  DataAPIPartitionFields?: string[];
  DataAPIFIPSFields: string[];
  ConsumerDataIdField: string;
  DefaultGeoId?: string;
  DefaultGeoName?: string;
  MapTigerId: boolean;
  MapStateId: boolean;
  GeoComparisonDisplayOrder: number;
  GeoCode: string[];
  // If true the geo type is neither mappable nor searchable
  IsForComparisonOnly: boolean;
};
// If mappable (will show on UI like map/dashboard)
export type MappableGeoType = GeoType & {
  Label: string;
  ServiceEndpoints: string[];
  CompareToTypes: string[];
  SupportsDynamicGeos: boolean;
  HasReport: boolean;
  DefaultDataVariableId: string;
  DataPanelVariableIds: string[];
  drawingProperties: DrawingProperties;
  // If true the geo type is also searchable in addition to being mappable
  IsSearchable: boolean;
};
// If searchable
export type SearchableGeoType = MappableGeoType & {
  SearchFields: string[];
  ServiceIndexForSearch: number;
};

// Report Types
export type ReportType = MetadataRecordWithID & {
  Name: string;
  IsDefault: boolean;
  PopUpTip: string;
};

// Report Sections
export type ReportSectionType =
  | 'TitlePage'
  | 'ContentPage'
  | 'BusinessSummary'
  | 'Footer';

export type TitlePageConfig = {
  title: string;
  customersHeader: string;
  customersDesc: string;
  businessesHeader: string;
  businessesDesc: string;
  consumersHeader: string;
  consumersDesc: string;
  description: string;
  logo: string;
};

export type FooterConfig = {
  logo: string;
  footnotes: string;
  contact: string;
};

// Report Variable Groups
export type ReportVariableGroupType =
  | 'BriefingPane'
  | 'BusinessSummary'
  | 'DataGrid'
  | 'DataList'
  | 'Footer'
  | 'TitlePage';
export type ReportVariableGroup = MetadataRecordWithID & {
  name: string;
  GroupType: ReportVariableGroupType;
  ReportSection: string;
  GroupHeader: string;
  GroupFooter?: string;
  NameColumnHeader: string;
  ValueColumnHeader: string;
  ValueWithMoEColumnHeader: string;
};

export type ReportGroupElement = {
  name: string;
  variableGroups: string[];
  GroupHeader: string;
  GroupFooter?: string;
};

export type ComparisonGroupElement = {
  sectorInfo: Record<string, unknown>;
  comparisonPane: {
    name: string;
    groups: ReportGroupElement[];
  };
};
export type ReportContentElement = {
  type: ReportVariableGroupType;
  config:
    | ReportGroupElement
    | ComparisonGroupElement
    | FooterConfig
    | TitlePageConfig;
};
export type ReportSection = MetadataRecordWithID & {
  name: string;
  SectionType: ReportSectionType;
  ReportTypes: string[];
  PopUpTip: string;
  UserMsg?: string;
  footer?: string;
  content?: ReportContentElement[];
};
export type ReportConfig = {
  ID: string;
  sections: ReportSection[];
};
// Data JAM Values/Flags
export type DataFlag = MetadataRecord & {
  FlagValue: string;
  FlagShortDesc: string;
  FlagDesc: string;
};

// Panel Visibilities
export type PanelVisibilityEvent =
  | 'industryChanged'
  | 'geoTypeChanged'
  | 'geographySelected'
  | 'dataVariableChanged'
  | 'splashPageOnOpen'
  | 'splashPageOnClose'
  | 'regionEditingStarted'
  | 'regionEditingCompleted'
  | 'filterCriteriaChanged';
export type PanelName =
  | 'dashboard'
  | 'dataVariableSelection'
  | 'geograhySelection'
  | 'geoSearch'
  | 'industrySelection'
  | 'legend'
  | 'regionSelection';
export type PanelVisibilityRule = MetadataRecord & {
  Event: PanelVisibilityEvent;
  PanelName: PanelName;
  Display: boolean;
};

// Core metadata driven by metadata.xlsx file
export type CoreMetadata = {
  standardIndustries: StandardIndustry[];
  variableCategories: VariableCategory[];
  dataVariables: DataVariable[];
  dataVariableGeoTypeVintages: DataVariableGeoTypeVintageOTW[];
  programs: Program[];
  geoTypes: (GeoType | MappableGeoType | SearchableGeoType)[];
  reportTypes: ReportType[];
  reportSections: ReportSection[];
  reportVariableGroups: ReportVariableGroup[];
  dataFlags: DataFlag[];
  panelVisibilityRules: PanelVisibilityRule[];
};

// Core metadata mixed in with Place Mapping and US States
export type AppMetadata = CoreMetadata & {
  placeMapping: PlaceMapping;
  usStates: USState[];
};

// Driven by Excel file but written separately as view classes load tooltips as a AMD module
export type ContentItemEntry = MetadataRecord & {
  PopUpTip?: string;
  Content?: string;
  LinkURL?: string;
};
export type Tooltips = {
  [k: string]: ContentItemEntry;
};
