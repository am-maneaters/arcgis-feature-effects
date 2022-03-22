import { startCase, clone, isString } from 'lodash-es';
import {
  isVariableUserDefined,
  NO_INDUSTRY_ID,
  UploadedDataVariable,
  UploadInfo,
  UserDefinedVariable,
} from '../typings/appModels';
import { AppConfig } from '../typings/configModels';
import {
  BaseAPIVariable,
  CURRENT_VINTAGE,
  DataAPIProgram,
  DataVariable,
  DataVariableGeoTypeVintage,
  APIVariable,
  DataVariableSourceOTW,
  GeoType,
  MappableGeoType,
  MetadataRecordWithID,
  SearchableGeoType,
  StandardIndustry,
  VariableCategory,
  PlaceMappingEntry,
  ReportType,
  GeoTypeVintageId,
  ReportSection,
  ReportVariableGroup,
  ReportConfig,
  ReportContentElement,
  AppMetadata,
} from '../typings/metadataModels';
import { isEmptyString, toNumber } from '../util/dataUtils';

export function isGeoTypeMappable(
  geoType: GeoType
): geoType is MappableGeoType {
  return geoType.IsForComparisonOnly === false;
}

export function isGeoTypeSearchable(
  geoType: GeoType
): geoType is SearchableGeoType {
  return isGeoTypeMappable(geoType) && geoType.IsSearchable === true;
}

export class MetadataService {
  private static metadata: AppMetadata;

  constructor(
    protected readonly originalMetadata: AppMetadata,
    protected readonly appConfig: AppConfig
  ) {
    if (MetadataService.metadata === undefined) {
      MetadataService.metadata = clone(this.originalMetadata);
    }
  }

  protected static getMetadata(): AppMetadata {
    return MetadataService.metadata;
  }

  protected static updateMetadata(metadata: AppMetadata): void {
    MetadataService.metadata = metadata;
  }

  // StandardIndustry related queries
  /**
   * Checks whether an industry exists by the specified Id or not. This method is intended to be called when
   * an unverified input should be validated before further processing, e.g. when reading the id from bookmark.
   * @param id Industry Id
   * @returns true if industry id is valid, false otherwise
   * @throws Error if id is not a string, is an empty string or if an industry with the specified id is not found
   */
  protected static isValidStandardIndustry(id: string): boolean {
    return MetadataService.isValidMetadataRecordID(
      MetadataService.getMetadata().standardIndustries,
      id
    );
  }

  /**
   * Returns all standard industries.
   * @returns All standard industries
   */
  protected static findAllStandardIndustries(): StandardIndustry[] {
    return MetadataService.getMetadata().standardIndustries;
  }

  /**
   * Returns all industries that do not have a parent defined or, in other words, are at the top level of the hierarchy.
   * @returns Top level standard industries
   */
  protected static findTopLevelStandardIndustries(): StandardIndustry[] {
    return MetadataService.findStandardIndustries(undefined);
  }

  /**
   * Returns all industries for the specified parent. If parent is undefined, then returns top level industries.
   * @param parentId Id of the parent
   * @returns Standard industries with specified parent
   */
  protected static findStandardIndustries(
    parentId: string | undefined
  ): StandardIndustry[] {
    return MetadataService.getMetadata().standardIndustries.filter(
      (stdIndustry) => stdIndustry.ParentID === parentId
    );
  }

  /**
   * Returns the industry with the specified id.
   * @param id Industry Id
   * @returns Standard Industry with the specified id
   * @throws Error if an industry with the specified id is not found
   */
  protected static findStandardIndustry(id: string): StandardIndustry {
    return MetadataService.getMetadataRecordByID(
      MetadataService.getMetadata().standardIndustries,
      id,
      'Industry'
    );
  }

  /**
   * Returns all variable categories that do not have a parent defined or, in other words, are at the top level of the hierarchy.
   * @returns Top level variable categories
   */
  static getTopLevelVariableCategories(): VariableCategory[] {
    return MetadataService.getVariableCategories(undefined);
  }

  /**
   * Returns all variable categories for the specified parent. If parent is undefined, then returns top level variable categories.
   * @param parentId Id of the parent
   * @returns Variable categories with specified parent
   */
  static getVariableCategories(
    parentId: string | undefined
  ): VariableCategory[] {
    return MetadataService.getMetadata().variableCategories.filter(
      (variableCategory) => variableCategory.ParentID === parentId
    );
  }

  // GeoType related queries
  /**
   * Checks whether a geo type exists by the specified Id or not. This method is intended to be called when
   * an unverified input should be validated before further processing, e.g. when reading the id from bookmark.
   * @param id Geo Type Id
   * @returns true if geo type id is valid, false otherwise
   * @throws Error if id is not a string, is an empty string or if a geo type with the specified id is not found
   */
  static isValidGeoType(id: string): boolean {
    return MetadataService.isValidMetadataRecordID(
      MetadataService.getMetadata().geoTypes,
      id
    );
  }

  /**
   * Returns all geo types.
   * @returns All geo types
   */
  static getAllGeoTypes(): GeoType[] {
    return MetadataService.getMetadata().geoTypes;
  }

  /**
   * Returns geo types that are mappable that is ones that do not have IsForComparisonOnly flag set to true.
   * @returns All geo types that are mappable
   */
  static getMappableGeoTypes(): MappableGeoType[] {
    return MetadataService.getMetadata()
      .geoTypes.filter((geoType) => !geoType.IsForComparisonOnly)
      .map((geoType) => geoType as MappableGeoType);
  }

  /**
   * Returns geo types that are mappable and have the IsSearchable flag set to true.
   * @returns All geo types that are searchable
   */
  static getSearchableGeoTypes(): SearchableGeoType[] {
    return MetadataService.getMetadata().geoTypes.filter(
      (geoType: SearchableGeoType) =>
        !geoType.IsForComparisonOnly && geoType.IsSearchable
    ) as SearchableGeoType[];
  }

  /**
   * Returns the geo type with the specified id.
   * @param id Geo Type Id
   * @returns Geo Type with the specified id
   * @throws Error if a geo type with the specified id is not found
   */
  static getGeoType(id: string): GeoType {
    return MetadataService.getMetadataRecordByID(
      MetadataService.getMetadata().geoTypes,
      id,
      'Geo Type'
    );
  }

  // DataVariable related queries
  /**
   * Checks whether a data variable exists by the specified Id or not. This method is intended to be called when
   * an unverified input should be validated before further processing, e.g. when reading the id from bookmark.
   * @param id Data Variable Id
   * @returns true if data variable id is valid, false otherwise
   * @throws Error if id is not a string, is an empty string or if a data variable with the specified id is not found
   */
  static isValidDataVariable(id: string): boolean {
    return MetadataService.isValidMetadataRecordID(
      MetadataService.getMetadata().dataVariables,
      id
    );
  }

  /**
   * Returns data variables for the specified categories. The returned list is sorted by the Display_Order field.
   * @returns All data varaibles that have the specified categories
   */
  static getDataVariables(categoryIds: string[]): DataVariable[] {
    return MetadataService.getMetadata()
      .dataVariables.filter((dataVariable) => {
        const varCategories = dataVariable.Variable_Categories;
        return (
          varCategories &&
          categoryIds.every(
            (categoryId, index) => varCategories[index] === categoryId
          )
        );
      })
      .sort(MetadataService.compareVariables);
  }

  public static getDataVariablesForReportGroup(
    reportGroupId: string
  ): DataVariable[] {
    return MetadataService.getMetadata()
      .dataVariables.filter(
        (dataVariable) =>
          dataVariable.Report_VariableGroups &&
          dataVariable.Report_VariableGroups.includes(reportGroupId)
      )
      .sort(MetadataService.compareVariables);
  }

  /**
   * Returns the data variable with the specified id.
   * @param id Data Variable Id
   * @returns Data Variable with the specified id
   * @throws Error if a data variable with the specified id is not found
   */
  public static getDataVariable(id: string): DataVariable {
    return MetadataService.getMetadataRecordByID(
      MetadataService.getMetadata().dataVariables,
      id,
      'Data Variable'
    );
  }

  /**
   * Checks whether the specified variable is unavailable for the given geo type.
   * @param variableId Data Variable Id
   * @param geoTypeId Geo Type id
   * @returns true if variable is unavailable, false otherwise
   */
  public static isVariableAvailableForGeoType(
    variableId: string,
    geoTypeId: string
  ): boolean {
    const vintages = MetadataService.getGeoVintagesForVariable(variableId);
    return vintages.some(
      (geoTypeVintage) =>
        geoTypeVintage.geoTypeId === geoTypeId &&
        geoTypeVintage.vintageId === CURRENT_VINTAGE
    );
  }

  private static addDataVariables(vars: DataVariable[]): void {
    const clonedMetadata = clone(MetadataService.getMetadata());
    clonedMetadata.dataVariables = [
      ...MetadataService.getMetadata().dataVariables,
      ...vars,
    ];
    MetadataService.updateMetadata(clonedMetadata);
  }

  static updateUserDefinedVars(
    uploadInfo: UploadInfo,
    uploadedVars: UploadedDataVariable[]
  ): void {
    const vars = uploadedVars.map((uploadedVar) =>
      MetadataService.createUserDefinedVar(uploadInfo, uploadedVar.ID)
    );
    MetadataService.addDataVariables(vars);
  }

  private static createUserDefinedVar(
    uploadInfo: UploadInfo,
    varID: string
  ): UserDefinedVariable {
    // Create "Variable"
    // Also include the uploadInfo to tell the outside world that this is a fabricated data variable
    const userDataVar: UserDefinedVariable = {
      row: 1,
      ID: varID,
      Name: varID,
      Display_Order: '1',
      Variable_Categories: ['user'],
      No_Time_Comp_Msg: 'Time Series not available',
      No_Geo_Comp_Msg: 'Geo hierarchy not presentable',
      ShowGeoChart: false,
      Round: 0,
      ScaleFactor: 1,
      UOM_Prefix: '',
      UOM_Suffix: '',
      Format_Number: true,
      PopUpTip: varID,
      uploadInfo,
      // industry cluster config
      DisableMultiIndustryCluster: false,
    };
    return userDataVar;
  }

  private static createGeoTypeVintagesForUserVariable(
    dataVariable: DataVariable,
    geoType: MappableGeoType,
    round: number
  ): DataVariableGeoTypeVintage[] {
    // Make up a URL for this user data.  This is just an opaque placeholder.  A more
    // semantic solution could be to find a way to pass in the URL of the loaded source file
    // with an anchor that identified the column, e.g. http://example.com/mydata.xlsx#col=3
    // const url = `cbb:${geoType.ID}:${dataVariable.ID}`;

    // Create a 'source' for this user variable
    const source = {
      source: 'USER_UPLOADED_DATA' as const,
      mapStateId: false,
      mapTigerId: false,
      geoFormat: '',
      programName: '',
      program: '',
      year: '',
      dataset: '',
      apiUrl: '',
      variableParts: {
        statVariable: {
          name: dataVariable.Name,
          alias: `1_${dataVariable.Name}_1`,
        },
      },
    };

    const vintages: DataVariableGeoTypeVintage[] = [
      // Create "current" vintage only
      {
        variableId: dataVariable.ID,
        Round: round,
        Format_Number: true,
        UOM_Prefix: '',
        UOM_Suffix: '',
        geoTypeId: geoType.ID,
        vintageId: 'current',
        operand1: {
          sources: [source],
          operandProcessor: 'IDENTITY',
        },
        Processor: 'IDENTITY',
        datasets: [],
        years: [],
        ScaleFactor: 1,
      },
    ];
    return vintages;
  }

  /**
   * Checks whether the specified variable is unavailable for the given geo types. A variable is deemed to be
   * unavailable if it is unavailable for any of the geo type in the set.
   * @param variableId Data Variable Id
   * @param geoTypeIds Geo Type ids
   * @returns true if variable is unavailable, false otherwise
   */
  public static isVariableAvailableForGeoTypes(
    variableId: string,
    geoTypeIds: string[]
  ): boolean {
    return geoTypeIds.every((geoTypeId) =>
      MetadataService.isVariableAvailableForGeoType(variableId, geoTypeId)
    );
  }

  /**
   * Checks whether the specified variable has time series data available for the given geo type. Time series data is deemed to be
   * available when there is at least one vintage other than 'current' defined for the geo type in its geo type vintage combinations.
   * @param variableId Data Variable Id
   * @param geoTypeId Geo Type id
   * @returns true if variable has time series data, false otherwise
   */
  public static varCanTimeCompare(
    variableId: string,
    geoTypeId: string
  ): boolean {
    return MetadataService.getGeoVintagesForVariable(variableId).some(
      (geoTypeVintage) =>
        geoTypeVintage.geoTypeId === geoTypeId &&
        geoTypeVintage.vintageId !== CURRENT_VINTAGE
    );
  }

  /**
   * Checks whether the specified variable has time series data for the given geo types. Time series data is never available
   * for multiple geo types so this will always return false when the length of the list of geo types is more than 1.
   * @param variableId Data Variable Id
   * @param geoTypeIds Geo Type ids
   * @returns true if variable has time series data, false otherwise
   */
  public static varCanTimeCompareMultiple(
    variableId: string,
    geoTypeIds: string[]
  ): boolean {
    if (geoTypeIds.length > 1) {
      return false;
    }
    return MetadataService.varCanTimeCompare(variableId, geoTypeIds[0]);
  }

  /**
   * Checks whether the specified variable has geographic comparison data available for the given geo type. Geographic comparison data is deemed to be
   * available when there is at least one geo type other than the one specified which has 'current' vintage defined and that geo type exists in the specified
   * geo type's CompareToTypes list. This method returns false when the ShowGeoChart has been set to false at the variable level which is the case for variables
   * that represent "absolute" values such as Total Population because in that case comparing a county to a state or nation would be non-sensical.
   * @param variableId Data Variable Id
   * @param geoTypeId Geo Type id
   * @returns true if variable has time series data, false otherwise
   */
  public static varCanGeoCompare(
    variableId: string,
    geoTypeId: string
  ): boolean {
    const dataVariable = MetadataService.getDataVariable(variableId);
    if (dataVariable.ShowGeoChart === false) {
      return false;
    }
    const geoType = MetadataService.getGeoType(geoTypeId);
    if (isGeoTypeMappable(geoType)) {
      return MetadataService.getGeoVintagesForVariable(dataVariable.ID).some(
        (geoTypeVintage) =>
          geoTypeVintage.geoTypeId !== geoType.ID &&
          geoTypeVintage.vintageId === 'current' &&
          geoType.CompareToTypes.includes(geoTypeVintage.geoTypeId)
      );
    }
    throw new Error(
      'Geographic Comparison is only supported for Mappable GeoTypes'
    );
  }

  /**
   * Checks whether the specified variable has geographic comparison data for the given geo types. Geographic
   * comparison data is deemed to be available when it is available for each geo type in the set.
   * @param variableId Data Variable Id
   * @param geoTypeIds Geo Type ids
   * @returns true if variable has time series data, false otherwise
   */
  static varCanGeoCompareMultiple(
    variableId: string,
    geoTypeIds: string[]
  ): boolean {
    return geoTypeIds.every((geoTypeId) =>
      MetadataService.varCanGeoCompare(variableId, geoTypeId)
    );
  }

  // DataVariableGeoVintages related queries
  /**
   * Returns the list of geo vintages for the specified variable.
   * @param variableId Data Variable id
   * @returns List of geo vintages
   */
  static getGeoVintagesForVariable(
    variableId: string
  ): readonly DataVariableGeoTypeVintage[] {
    const dataVariable = MetadataService.getDataVariable(variableId);
    if (isVariableUserDefined(dataVariable)) {
      return MetadataService.createGeoTypeVintagesForUserVariable(
        dataVariable,
        dataVariable.uploadInfo.geoType,
        0
      );
    }
    const metadata = MetadataService.getMetadata();
    const otwDataVarGeoTypeVintages =
      metadata.dataVariableGeoTypeVintages.filter(
        (geoTypeVintage) => geoTypeVintage.variableId === variableId
      );

    return otwDataVarGeoTypeVintages.map((otwDataVarGeoTypeVintage) => {
      const {
        // DataVariableDisplayProperties
        Round,
        UOM_Prefix,
        UOM_Suffix,
        Format_Number,
        // GeoTypeVintageShell
        geoTypeId,
        vintageId,
        Processor,
        ScaleFactor,
      } = otwDataVarGeoTypeVintage;

      const years: string[] = [];
      const datasets: string[] = [];
      const dataVarGeoTypeVintage: DataVariableGeoTypeVintage = {
        Round,
        UOM_Prefix,
        UOM_Suffix,
        Format_Number,
        geoTypeId,
        vintageId,
        Processor,
        ScaleFactor,
        variableId,
        years,
        datasets,
        operand1: {
          sources: MetadataService.getOperandSources(
            variableId,
            otwDataVarGeoTypeVintage.operand1.sources,
            years,
            datasets,
            1
          ),
          operandProcessor: otwDataVarGeoTypeVintage.operand1.operandProcessor,
        },
      };
      if (otwDataVarGeoTypeVintage.operand2 !== undefined) {
        dataVarGeoTypeVintage.operand2 = {
          sources: MetadataService.getOperandSources(
            variableId,
            otwDataVarGeoTypeVintage.operand2.sources,
            years,
            datasets,
            2
          ),
          operandProcessor: otwDataVarGeoTypeVintage.operand2.operandProcessor,
        };
      }
      return dataVarGeoTypeVintage;
    });
  }

  /**
   * Returns a GeoTypeVintage for the current data variable.
   * @param variableId Data Variable Id
   * @param geoTypeId Geo Type Id
   * @param vintage Geo Type Vintage Id
   * @returns the geo type vintage object.  Throws if not found.
   */
  static getVintageForVariable(
    variableId: string,
    geoTypeId: string,
    vintageId: GeoTypeVintageId
  ): DataVariableGeoTypeVintage {
    const geoVintages = MetadataService.getGeoVintagesForVariable(variableId);
    const geoVintage = geoVintages.find(
      (geoTypeVintage) =>
        geoTypeVintage.geoTypeId === geoTypeId &&
        geoTypeVintage.vintageId === vintageId
    );

    if (!geoVintage) {
      throw Error(
        `Cannot find vintage ${vintageId} on variable ${variableId} with geoType ${geoTypeId}`
      );
    }

    return geoVintage;
  }

  static findVintageForVariable(
    variableId: string,
    geoTypeId: string,
    vintageId: GeoTypeVintageId
  ): DataVariableGeoTypeVintage | undefined {
    const geoVintages = MetadataService.getGeoVintagesForVariable(variableId);
    return geoVintages.find(
      (geoTypeVintage) =>
        geoTypeVintage.geoTypeId === geoTypeId &&
        geoTypeVintage.vintageId === vintageId
    );
  }

  /**
   * Tests if a specific vintage is available on a data variable
   * @param variableId Data Variable Id
   * @param geoTypeId Geo Type Id
   * @param vintageId Geo Type Vintage Id
   * @returns the geo type vintage object.  Throws if not found.
   */
  static isVintageAvailableForVariable(
    variableId: string,
    geoTypeId: string,
    vintageId: GeoTypeVintageId
  ): boolean {
    const geoVintages = MetadataService.getGeoVintagesForVariable(variableId);
    return geoVintages.some(
      (geoTypeVintage) =>
        geoTypeVintage.geoTypeId === geoTypeId &&
        geoTypeVintage.vintageId === vintageId
    );
  }

  private static isVGTVIndustryBased(
    varGeoTypeVintage: DataVariableGeoTypeVintage
  ): boolean {
    const allSources = [
      ...varGeoTypeVintage.operand1.sources,
      ...(varGeoTypeVintage.operand2 === undefined
        ? []
        : varGeoTypeVintage.operand2.sources),
    ];
    // If any of the source has a sector field, then the variable is industry based
    return (
      allSources.every((source) => source.sectorField === undefined) === false
    );
  }

  public static getIndustryLikeIdForVGTV(
    varGeoTypeVintage: DataVariableGeoTypeVintage,
    selectedIndustryId: string
  ): string {
    if (MetadataService.isVGTVIndustryBased(varGeoTypeVintage)) {
      return selectedIndustryId;
    }
    return NO_INDUSTRY_ID;
  }

  // Place Mapping queries
  /**
   * Returns a place mapping for a given GeoId
   * @param var1
   * @param var2
   */
  public static getPlaceMappingForGeoId(geoId: string): PlaceMappingEntry {
    return MetadataService.getMetadata().placeMapping[geoId];
  }

  // ReportTypes related queries
  public static isValidReportType(id: string): boolean {
    return MetadataService.isValidMetadataRecordID(
      MetadataService.getMetadata().reportTypes,
      id
    );
  }

  public static getReportTypes(): ReportType[] {
    return MetadataService.getMetadata().reportTypes;
  }

  public static getDefaultReportType(): ReportType {
    const defaultReportType = MetadataService.getMetadata().reportTypes.find(
      ({ IsDefault }) => IsDefault
    );
    if (!defaultReportType) {
      throw new Error('Could not find default report type');
    }
    return defaultReportType;
  }

  /**
   * Returns the report type with the specified id.
   * @param id Report Type Id
   * @returns Report Type with the specified id
   * @throws Error if a report type with the specified id is not found
   */
  public static getReportType(id: string): ReportType {
    return MetadataService.getMetadataRecordByID(
      MetadataService.getMetadata().reportTypes,
      id,
      'Report Type'
    );
  }

  public static getReportSections(reportTypeId: string): ReportSection[] {
    return MetadataService.getMetadata().reportSections.filter(
      (reportSection) => reportSection.ReportTypes.includes(reportTypeId)
    );
  }

  public static getAllReportVariableGroups(): ReportVariableGroup[] {
    return MetadataService.getMetadata().reportVariableGroups;
  }

  public static getReportVariableGroups(
    reportSectionId: string
  ): ReportVariableGroup[] {
    return MetadataService.getMetadata().reportVariableGroups.filter(
      (reportVariableGroup) =>
        reportVariableGroup.ReportSection === reportSectionId
    );
  }

  // Report config related queries - temporary implementation to regenerate the old structure to make reports work
  public static getReportConfig(reportTypeId?: string): ReportConfig {
    const id: string | undefined = reportTypeId;

    return MetadataService.generateReportConfigs().filter(
      (reportConfig) => reportConfig.ID === id
    )[0];
  }

  private static generateReportConfigs(): ReportConfig[] {
    const { reportTypes } = MetadataService.getMetadata();
    const reportConfigs = reportTypes.map(({ ID }) => ({
      ID,
      sections: MetadataService.generateSectionsForReport(ID),
    }));
    return reportConfigs;
  }

  private static generateSectionsForReport(
    reportTypeId: string
  ): ReportSection[] {
    const reportSections = MetadataService.getReportSections(reportTypeId);
    const sectionsForReport: ReportSection[] = [];
    for (let i = 0; i < reportSections.length; i += 1) {
      const reportSection = reportSections[i];
      const applicableReportTypes = reportSection.ReportTypes;
      if (applicableReportTypes.includes(reportTypeId)) {
        let sectionContent: ReportContentElement[] = [];
        if (reportSection.SectionType === 'TitlePage') {
          const titleContent: ReportContentElement = {
            type: 'TitlePage',
            config: {
              title: 'Local Business Profile',
              customersHeader: 'My Customers',
              customersDesc:
                'The My Customers section provides summarized demographic information for ${place_name}. This information provides a snapshot of the makeup of the community of potential customers in the area.',
              businessesHeader: 'Businesses Like Mine',
              businessesDesc:
                'The Businesses Like Mine section provides summarized information about ${sector_name} businesses in ${place_name}. This information provides insight into the volume, finance, and diversity of ownership of the businesses in the area.',
              consumersHeader: 'Consumer Spending',
              consumersDesc:
                'The Consumer Spending section provides a high-level overview of the spending patterns of consumers in ${place_name}.',
              description: '',
              logo: 'images/cbb-logo.png',
            },
          };
          sectionContent.push(titleContent);
        } else if (reportSection.SectionType === 'Footer') {
          const footerContent: ReportContentElement = {
            type: 'Footer',
            config: {
              logo: 'images/census-logo-white.png',
              footnotes:
                '<ul>' +
                '<li><strong>N/A</strong>: Data or ratio are not available. This may result when data cannot be released due to data confidentiality or quality concerns or when a data element is not produced, due to changes in classifications or other survey changes.</li>' +
                '<li><strong>MoE</strong>: QCEW data are not estimates and, because it is a census, there is no calculation for margin of error.</li>' +
                '<li><strong>Private ownership</strong>: Data from QCEW are aggregations of various kinds of business establishment data, including geographical, industry, ownership, and establishment size data.  QCEW data used in the Census Business Builder are all Private Ownerships. For complete datasets including Government Ownerships and Total Covered Ownerships, please visit the QCEW website: <a href="https://www.bls.gov/cew/">https://www.bls.gov/cew/</a>.</li>' +
                '<li><strong>Note</strong>: The American Community Survey (ACS) margins of error (MOE) shown in the report are calculated using an approximation method. They may not match those shown on other Census applications, e.g. American FactFinder.</li>' +
                '</ul>' +
                '<strong>Suppressed Definitions</strong>' +
                '<table>' +
                '<tr><td>a</td><td>0 to 19 employees</td><td>b</td><td>20 to 99 employees</td></tr>' +
                '<tr><td>c</td><td>100 to 249 employees</td><td>e</td><td>250 to 499 employees</td></tr>' +
                '<tr><td>f</td><td>500 to 999 employees</td><td>g</td><td>1,000 to 2,499 employees</td></tr>' +
                '<tr><td>h</td><td>2,500 to 4,999 employees</td><td>i</td><td>5,000 to 9,999 employees</td></tr>' +
                '<tr><td>j</td><td>10,000 to 24,999 employees</td><td>k</td><td>25,000 to 49,999 employees</td></tr>' +
                '<tr><td>l</td><td>50,000 to 99,999 employees</td><td>m</td><td>100,000 employees or more</td></tr>' +
                '<tr><td>D</td><td>Withheld due to disclosure</td><td>N</td><td>Not available/comparable</td></tr>' +
                "<tr><td>S</td><td>Doesn't meet publication standards</td><td>z</td><td>&lt; half the unit shown</td></tr>" +
                '</table>',
              contact:
                'Contact Us: <br />United States Census Bureau<br />4600 Silver Hill Road<br />Washington, DC 20233<br /> Ph: 301-763-INFO (4636)',
            },
          };
          sectionContent.push(footerContent);
        } else if (
          reportSection.SectionType === 'ContentPage' ||
          reportSection.SectionType === 'BusinessSummary'
        ) {
          sectionContent =
            MetadataService.getReportGroupsForSection(reportSection);
        }
        if (sectionContent.length > 0) {
          reportSection.content = sectionContent;
          sectionsForReport.push(reportSection);
        }
      }
    }

    return sectionsForReport;
  }

  private static getReportGroupsForSection(
    reportSection: ReportSection
  ): ReportContentElement[] {
    const reportGroups = MetadataService.getReportVariableGroups(
      reportSection.ID
    );
    const currentSection = reportGroups.filter(
      ({ ReportSection: section }) => section === reportSection.ID
    );

    if (reportSection.SectionType === 'ContentPage') {
      const contentElements = currentSection.map(
        ({ GroupHeader, GroupType, GroupFooter, name, ID }) => ({
          type: GroupType,
          config: {
            name,
            variableGroups: [ID],
            GroupHeader,
            GroupFooter,
          },
        })
      );
      return contentElements;
    }
    if (reportSection.SectionType === 'BusinessSummary') {
      const groupElements = currentSection.map(
        ({ name, GroupHeader, GroupFooter, ID }) => ({
          name,
          variableGroups: [ID],
          GroupHeader,
          GroupFooter,
        })
      );

      const sectionContent: ReportContentElement = {
        type: 'BusinessSummary',
        config: {
          sectorInfo: {},
          comparisonPane: {
            name: reportSection.name,
            groups: groupElements,
          },
        },
      };

      return groupElements.length > 0 ? [sectionContent] : [];
    }
    return [];
  }

  // private helper methods
  private static getOperandSources(
    variableId: string,
    sources: DataVariableSourceOTW[],
    years: string[],
    datasets: string[],
    operand: number
  ): APIVariable[] {
    const opSources: APIVariable[] = sources.map((otwOpSource, index) => {
      // Find program
      const opProgram = MetadataService.getMetadata().programs.filter(
        (program) => program.ID === otwOpSource.programId
      )[0];
      // accumulate years
      if (!years.includes(opProgram.Year)) {
        years.push(opProgram.Year);
      }
      // accumulate datasets
      if (!datasets.includes(opProgram.Dataset)) {
        datasets.push(opProgram.Dataset);
      }
      // Read data from program
      const {
        Source: source,
        Name: programName,
        Program: program,
        Year: year,
        Dataset: dataset,
        API_URL: apiUrl,
        MapTigerId: mapTigerId,
        MapStateId: mapStateId,
        FlagStrategy,
        ReliabilityStrategy,
      } = opProgram;

      // Read data from data source
      const {
        Variable,
        URL_Parameters: urlParameters,
        Sector_Field: sectorField,
        RACE_GROUP: raceGroup,
        SEX: sex,
        VET_GROUP: vetGroup,
      } = otwOpSource;

      const baseDetails: BaseAPIVariable = {
        // From Program
        source,
        programName,
        program,
        year,
        dataset,
        apiUrl,
        mapTigerId,
        mapStateId,
        // url: API_URL,
        // source: Source,
        // mapTIGERId: MapTigerId,
        // mapStateId: MapStateId,

        // From data source
        variableParts: {
          statVariable: {
            name: Variable,
            alias: `${variableId}_${otwOpSource.Variable}_${operand}_${
              index + 1
            }`,
          },
        },
        urlParameters,
        sectorField,
        raceGroup,
        sexGroup: sex,
        vetGroup,
      };
      if (FlagStrategy !== undefined) {
        let varName;
        let varAlias;
        switch (FlagStrategy) {
          case 'PREFIX_S': {
            varName = `s${Variable}`;
            varAlias = `${variableId}_s${otwOpSource.Variable}_S_${operand}_${
              index + 1
            }`;
            break;
          }
          case 'UNDERSCORE_F': {
            varName = `${Variable}_F`;
            varAlias = `${variableId}_${otwOpSource.Variable}_F_${operand}_${
              index + 1
            }`;
            break;
          }
          default: {
            return MetadataService.assertNever();
          }
        }
        baseDetails.variableParts.flagVariable = {
          name: varName,
          alias: varAlias,
        };
        baseDetails.flagStrategy = FlagStrategy;
      }

      if (ReliabilityStrategy !== undefined) {
        let varName;
        let varAlias;
        switch (ReliabilityStrategy) {
          case 'ACS_MOE': {
            const moeVariable = `${Variable.substring(
              0,
              Variable.length - 1
            )}M`;
            varName = moeVariable;
            varAlias = `${variableId}_${moeVariable}_${operand}_${index + 1}`;
            break;
          }
          default: {
            return MetadataService.assertNever();
          }
        }
        baseDetails.variableParts.moeVariable = {
          name: varName,
          alias: varAlias,
        };
        baseDetails.reliabilityStrategy = ReliabilityStrategy;
      }

      let opSource: APIVariable;
      switch (opProgram.Source) {
        case 'CENSUS_DATA_API': {
          opSource = {
            ...otwOpSource,
            ...baseDetails,
            source: 'CENSUS_DATA_API',
            geoFormat: (opProgram as DataAPIProgram).GeoFormat,
          };
          break;
        }
        case 'ESRI_CONSUMER_DATA': {
          opSource = {
            ...otwOpSource,
            ...baseDetails,
            source: 'ESRI_CONSUMER_DATA',
          };
          break;
        }
        default: {
          return MetadataService.assertNever();
        }
      }
      return opSource;
    });
    return opSources;
  }

  private static assertNever(): never {
    throw new Error();
  }

  private static compareVariables(
    var1: DataVariable,
    var2: DataVariable
  ): number {
    const var1DisplayOrder = toNumber(
      var1.Display_Order.substring(var1.Display_Order.lastIndexOf('-') + 1)
    );
    const var2DisplayOrder = toNumber(
      var2.Display_Order.substring(var2.Display_Order.lastIndexOf('-') + 1)
    );
    if (var1DisplayOrder < var2DisplayOrder) {
      return -1;
    }
    if (var1DisplayOrder > var2DisplayOrder) {
      return 1;
    }
    return 0;
  }

  public static getStateFipsCode(statePostal: string): string {
    const state = MetadataService.getMetadata().usStates.find(
      (usState) => usState.abbreviation === statePostal
    );
    if (state === undefined) {
      throw Error(`Postal Code ${statePostal} not found in metadata`);
    }

    return state.FIPS;
  }

  public static getStateNameByFIPS(fipsCode: string): string {
    const state = MetadataService.getMetadata().usStates.find(
      (usState) => usState.FIPS === fipsCode
    );
    if (state === undefined) {
      throw Error(`FIPS Code ${fipsCode} not found in metadata`);
    }

    return startCase(state.name.toLowerCase());
  }

  public static getStatePostalCode(fipsCode: string): string {
    const state = MetadataService.getMetadata().usStates.find(
      (usState) => usState.FIPS === fipsCode
    );
    if (state === undefined) {
      throw Error(`FIPS Code ${fipsCode} not found in metadata`);
    }

    return state.abbreviation;
  }

  // Internal functions
  private static isValidMetadataRecordID<T extends MetadataRecordWithID>(
    objCollection: T[],
    id: string
  ): boolean {
    if (!isString(id)) {
      throw new Error(
        `ID ${id} is not of type string. Convert id to a string using dataUtils.toString() function`
      );
    }
    if (isEmptyString(id)) {
      throw new Error('ID canot be an empty string');
    }
    return objCollection.some((obj) => obj.ID === id);
  }

  private static getMetadataRecordByID<T extends MetadataRecordWithID>(
    objCollection: T[],
    id: string,
    objectType: string
  ): T {
    if (MetadataService.isValidMetadataRecordID(objCollection, id)) {
      const standardIndustries: T[] = objCollection.filter(
        (stdIndustry) => stdIndustry.ID === id
      );
      return standardIndustries[0];
    }
    throw new Error(`${objectType} ${id} not found`);
  }
}
