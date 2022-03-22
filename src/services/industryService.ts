import Graphic from '@arcgis/core/Graphic';
import { keyBy } from 'lodash-es';
import * as QueryUtils from '../util/queryUtils';
import {
  DataVariableGeoTypeVintage,
  StandardIndustry,
} from '../typings/metadataModels';
import {
  AmbientIndustry,
  IndustrySearchResult,
  MergedIndustryWithCoverage,
  NAICSIndustry,
  NAICSIndustryWithCoverage,
  NAICSIndustrySynonym,
  StandardIndustryNotNAICS,
} from '../typings/appModels';
import { MetadataService } from './metadataService';

export enum StandardIndustryOptions {
  ALL = 'ALL',
  TOP = 'TOP',
  LEAF = 'LEAF',
}

export class IndustryService extends MetadataService {
  static async getAllStandardIndustries(
    option: StandardIndustryOptions = StandardIndustryOptions.TOP
  ): Promise<AmbientIndustry[]> {
    let childIndustries: StandardIndustry[] = [];
    switch (option) {
      case StandardIndustryOptions.ALL: {
        childIndustries = MetadataService.findAllStandardIndustries();
        break;
      }
      case StandardIndustryOptions.TOP: {
        childIndustries = IndustryService.findTopLevelStandardIndustries();
        break;
      }
      case StandardIndustryOptions.LEAF: {
        const allIndustries = MetadataService.findAllStandardIndustries();
        childIndustries = allIndustries.filter((parentIndustry) => {
          const isParent = allIndustries.some(
            (childIndustry) => childIndustry.ParentID === parentIndustry.ID
          );
          return isParent === false;
        });
        break;
      }
      default: {
        childIndustries = [];
      }
    }
    return IndustryService.augmentStandardIndustriesWithNAICSInfo(
      childIndustries
    );
  }

  static async getStandardIndustries(
    parentId: string | undefined
  ): Promise<AmbientIndustry[]> {
    const standardIndustries = IndustryService.findStandardIndustries(parentId);
    return IndustryService.augmentStandardIndustriesWithNAICSInfo(
      standardIndustries
    );
  }

  static async getIndustryLineage(
    industryId: string
  ): Promise<AmbientIndustry[]> {
    const standardIndustries: StandardIndustry[] = [];
    let currentIndustryId: string | undefined = industryId;
    while (currentIndustryId !== undefined) {
      if (MetadataService.isValidStandardIndustry(industryId)) {
        const standardIndustry =
          IndustryService.findStandardIndustry(currentIndustryId);
        standardIndustries.unshift(standardIndustry);
        currentIndustryId = standardIndustry.ParentID;
      } else {
        break;
      }
    }
    return IndustryService.augmentStandardIndustriesWithNAICSInfo(
      standardIndustries
    );
  }

  static async findIndustry(
    industryId: string
  ): Promise<NAICSIndustryWithCoverage | undefined> {
    const naicsIndustriesMap = await IndustryService.findNAICSIndustries([
      industryId,
    ]);
    const naicsIndustrieIds = Object.keys(naicsIndustriesMap);
    if (naicsIndustrieIds.length !== 0) {
      return naicsIndustriesMap[naicsIndustrieIds[0]];
    }
    return undefined;
  }

  static async getIndustry(
    industryId: string
  ): Promise<NAICSIndustryWithCoverage> {
    const naicsIndustriesMap = await IndustryService.findNAICSIndustries([
      industryId,
    ]);
    const naicsIndustry = Object.values(naicsIndustriesMap)[0];
    if (MetadataService.isValidStandardIndustry(industryId)) {
      return IndustryService.standardIndustryToAmbientIndustry(
        IndustryService.findStandardIndustry(industryId),
        naicsIndustry
      ) as NAICSIndustryWithCoverage;
    }
    return naicsIndustry;
  }

  static async getIndustries(
    industryIds: string[]
  ): Promise<NAICSIndustryWithCoverage[]> {
    const naicsIndustriesMap = await IndustryService.findNAICSIndustries(
      industryIds
    );
    return Object.values(naicsIndustriesMap).map((naicsIndustry) => {
      if (MetadataService.isValidStandardIndustry(naicsIndustry.ID)) {
        return IndustryService.standardIndustryToAmbientIndustry(
          IndustryService.findStandardIndustry(naicsIndustry.ID),
          naicsIndustry
        ) as NAICSIndustryWithCoverage;
      }
      return naicsIndustry;
    });
  }

  private static uniqueByID(features: Graphic[]): NAICSIndustryWithCoverage[] {
    const allIDs = features.map((x) => x.attributes.ID);
    const uniqueIDs = [...new Set(allIDs)];

    return uniqueIDs.map((id) =>
      IndustryService.graphicToNAICSIndustryWithCoverage(
        features[allIDs.indexOf(id)]
      )
    );
  }

  static async getChildIndustries(
    parentID: string
  ): Promise<IndustrySearchResult[]> {
    const serviceURL = ENV_CONFIG.envConfig.industryAliasAPIUrl;
    const outFields = ['*'];
    const whereClause = `ParentID = '${parentID}'`;
    const orderByFields = ['sort', 'level', 'isSynonym'];

    const query = QueryUtils.createQuery(
      false,
      outFields,
      whereClause,
      undefined,
      orderByFields
    );
    const [features] = await QueryUtils.runQuery(serviceURL, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });
    return IndustryService.uniqueByID(features);
  }

  static async searchIndustries(
    searchText: string
  ): Promise<IndustrySearchResult[]> {
    const searchTextLowered = searchText.toLowerCase();

    const serviceURL = ENV_CONFIG.envConfig.industryAliasAPIUrl;
    const outFields = [
      'ID',
      'ParentID',
      'Name',
      'level',
      'synonym',
      'isSynonym',
    ];
    const whereClause = `synonymLowerCase LIKE '%${searchTextLowered}%' OR ID LIKE '%${searchTextLowered}%' `;
    const orderByFields = ['sort', 'level', 'isSynonym'];

    const query = QueryUtils.createQuery(
      false,
      outFields,
      whereClause,
      undefined,
      orderByFields
    );
    const [features] = await QueryUtils.runQuery(serviceURL, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });

    return IndustryService.handleSearchResults(features);
  }

  // Original implmentation - now simply calls new implmentation so that the callers don't have to change
  static isVariableAvailableForIndustries(
    variableId: string,
    industries: NAICSIndustryWithCoverage[]
  ): boolean {
    return IndustryService.isVariableUnAvailableForMultiIndustryCluster(
      variableId,
      industries
    );
  }

  // New implementation now checks whether the data variable supports multi industry cluster or not.
  // The UI still calls the original but IndustryService.method is there just in case we need to distinguish the messages or need IndustryService.elsewhere.
  static isVariableUnAvailableForMultiIndustryCluster(
    variableId: string,
    industries: NAICSIndustryWithCoverage[]
  ): boolean {
    let varUnavailable = industries.some((industry) =>
      IndustryService.isVariableUnAvailableForIndustry(variableId, industry)
    );
    // If data variable is available for all industries individually, also check if it is available when we are working with a cluster.
    if (industries.length > 1 && varUnavailable === false) {
      const dataVar = IndustryService.getDataVariable(variableId);
      if (dataVar.DisableMultiIndustryCluster === true) {
        varUnavailable = true;
      }
    }
    return varUnavailable;
  }

  static isVariableUnAvailableForIndustry(
    variableId: string,
    industry: NAICSIndustryWithCoverage
  ): boolean {
    const geoTypeVintages = IndustryService.getGeoVintagesForVariable(
      variableId
    ).filter((geoTypeVintage) => geoTypeVintage.vintageId === 'current');
    let unAvailable = true;
    if (geoTypeVintages.length > 0) {
      unAvailable = !geoTypeVintages.some((geoTypeVintage) =>
        IndustryService.isVariableAvailableForGeoTypeVintage(
          industry,
          geoTypeVintage
        )
      );
    }
    return unAvailable;
  }

  /* ***********************************************************************************************************************
   * Industry Service Internal Functions
   ************************************************************************************************************************ */
  private static isVariableAvailableForGeoTypeVintage(
    industry: NAICSIndustryWithCoverage,
    geoTypeVintage: DataVariableGeoTypeVintage
  ): boolean {
    const available = geoTypeVintage.datasets.every((dataset) => {
      // All programs are now assigned a dataset in metadata.
      // If dataset type (e.g. EC, CBP, NS, SBO, TRADE, AG, QWI, QCEW) isn't present then return true;
      // IndustryService.will be the case for ACS programs, Consumer spending etc.
      if (!(dataset in industry.coverage)) {
        return true;
      }

      // Otherwise check for the flag
      return (
        industry.coverage[dataset] === 'S' || industry.coverage[dataset] === 'X'
      );
    });
    return available;
  }

  private static async augmentStandardIndustriesWithNAICSInfo(
    childIndustries: StandardIndustry[]
  ): Promise<AmbientIndustry[]> {
    // We maintain a flag in standard industry object "isNaicsIndustry" to indicate whether that
    // industry has been tested again NAICS so as to avoid hitting the database again and again.
    // IndustryService.is the only place in the application where we have to "modify" a metadata object.
    // Create list of standard industries that don't yet have info about NAICS
    const standardIndustriesNoNaics = childIndustries.filter(
      (industry) => industry.isNaicsIndustry === 'UNKNOWN'
    );
    // Create list of standard industries that have info about NAICS
    const standardIndustriesWithNaics = childIndustries.filter(
      (industry) => industry.isNaicsIndustry !== 'UNKNOWN'
    ) as AmbientIndustry[];
    // If the of industries that don't have NAICS in not empty...
    if (standardIndustriesNoNaics.length > 0) {
      // then create a map of them
      const standardIndustriesNoNaicsMap = keyBy(
        standardIndustriesNoNaics,
        'ID'
      );
      // get NAICS data
      const naicsIndustriesMap = await IndustryService.findNAICSIndustries(
        Object.keys(standardIndustriesNoNaicsMap)
      );
      // Fill in standard industries with NAICS info
      Object.values(standardIndustriesNoNaicsMap).forEach((industry) =>
        IndustryService.standardIndustryToAmbientIndustry(
          industry,
          naicsIndustriesMap[industry.ID]
        )
      );
      const ambientIndustries = [
        ...Object.values(standardIndustriesNoNaicsMap).sort(
          (industry1, industry2) => (industry1.row > industry2.row ? 1 : -1)
        ),
        ...standardIndustriesWithNaics,
      ] as AmbientIndustry[];
      return ambientIndustries;
    }
    return standardIndustriesWithNaics;
  }

  private static graphicToNAICSIndustryWithCoverage(
    industryFeature: Graphic
  ): NAICSIndustryWithCoverage {
    const industryFeatureAttributes = industryFeature.attributes;
    const industryObj: NAICSIndustryWithCoverage = {
      ID: industryFeatureAttributes.ID,
      Name: industryFeatureAttributes.Name,
      NAICSID: industryFeatureAttributes.ID,
      NAICSParentID: industryFeatureAttributes.ParentID,
      NAICSName: industryFeatureAttributes.Name,
      NAICSLevel: industryFeatureAttributes.level,
      isSynonym: false,
      coverage: {
        EWKS: industryFeatureAttributes.EC,
        CBP: industryFeatureAttributes.CBP,
        NES: industryFeatureAttributes.NS,
        // SBO: industryFeatureAttributes.SBO,
        // Cloogy fix to treat SBO flag for ABS.
        // Ideally we should be updating the NAICS file to update the program name
        // but this does the trick in the short term.
        ABS: industryFeatureAttributes.SBO,
        TRADE: industryFeatureAttributes.TRADE,
        AG: industryFeatureAttributes.AG,
        QWI: industryFeatureAttributes.QWI,
        BLS: industryFeatureAttributes.QCEW,
      },
    };
    if (industryFeatureAttributes.ESTABSCBP2016 !== null) {
      industryObj.coverage.establishmentCount =
        industryFeatureAttributes.ESTABSCBP2016;
    }
    return industryObj;
  }

  public static async findIndustryChildCounts(
    industryIds: string[]
  ): Promise<Record<string, number>> {
    const serviceURL = ENV_CONFIG.envConfig.industryDataAPIUrl;
    const outFields = ['*'];

    const whereClause =
      industryIds.length === 0
        ? '1=0'
        : QueryUtils.createInSQLQuery('ParentID', industryIds, true);

    const query = QueryUtils.createQuery(false, outFields, whereClause);
    const [features] = await QueryUtils.runQuery(serviceURL, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });

    const naicsIndustries = features.map(
      IndustryService.graphicToNAICSIndustryWithCoverage
    );

    const childCounts: Record<string, number> = naicsIndustries.reduce(
      (grouping, feature) => {
        const id = feature.NAICSParentID;
        const count = grouping[id] || 0;

        grouping[id] = count + 1;
        return grouping;
      },
      {}
    );

    return childCounts;
  }

  private static async findNAICSIndustries(
    industryIds: string[]
  ): Promise<Record<string, NAICSIndustryWithCoverage>> {
    const serviceURL = ENV_CONFIG.envConfig.industryDataAPIUrl;
    const outFields = ['*'];

    const whereClause = QueryUtils.createInSQLQuery('ID', industryIds, true);

    const query = QueryUtils.createQuery(false, outFields, whereClause);
    const [industryFeatures] = await QueryUtils.runQuery(serviceURL, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });
    const naicsIndustries = industryFeatures.map(
      IndustryService.graphicToNAICSIndustryWithCoverage
    );
    const naicsIndustriesMap = keyBy(naicsIndustries, 'NAICSID');
    return naicsIndustriesMap;
  }

  private static standardIndustryToAmbientIndustry(
    standardIndustry: StandardIndustry,
    naicsIndustry?: NAICSIndustryWithCoverage
  ): AmbientIndustry {
    // Don't do anything if we already know the status of standard industry
    if (standardIndustry.isNaicsIndustry === 'UNKNOWN') {
      if (naicsIndustry === undefined) {
        standardIndustry.isNaicsIndustry = 'NO';
        return standardIndustry as StandardIndustryNotNAICS;
      }

      standardIndustry.isNaicsIndustry = 'YES';
      const standardIndustryName = standardIndustry.Name;
      // Merging with NAICS will overwrite standard name with NAICS name
      const mergedIndustry = Object.assign(
        standardIndustry,
        naicsIndustry
      ) as MergedIndustryWithCoverage;
      // Reset it to standard name
      mergedIndustry.Name = standardIndustryName;
    }
    return standardIndustry as AmbientIndustry;
  }

  private static handleSearchResults(
    features: Graphic[]
  ): IndustrySearchResult[] {
    return features.reduce((agg, industryFeature) => {
      const industryFeatureAttributes = industryFeature.attributes;
      if (industryFeatureAttributes.isSynonym === 'true') {
        const naicsIndustrySynonym: NAICSIndustrySynonym = {
          ID: industryFeatureAttributes.ID,
          Name: industryFeatureAttributes.synonym,
          NAICSID: industryFeatureAttributes.ID,
          NAICSParentID: industryFeatureAttributes.ParentID,
          NAICSName: industryFeatureAttributes.synonym,
          NAICSLevel: industryFeatureAttributes.level,
          isSynonym: true,
        };
        agg.push(naicsIndustrySynonym);
      } else {
        const naicsIndustry: NAICSIndustry = {
          ID: industryFeatureAttributes.ID,
          Name: industryFeatureAttributes.synonym,
          NAICSID: industryFeatureAttributes.ID,
          NAICSParentID: industryFeatureAttributes.ParentID,
          NAICSName: industryFeatureAttributes.synonym,
          NAICSLevel: industryFeatureAttributes.level,
          isSynonym: false,
        };
        agg.push(naicsIndustry);
      }
      return agg;
    }, [] as IndustrySearchResult[]);
  }
}
