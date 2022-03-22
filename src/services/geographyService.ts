import Graphic from '@arcgis/core/Graphic';
import Extent from '@arcgis/core/geometry/Extent';
import Geometry from '@arcgis/core/geometry/Geometry';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Query from '@arcgis/core/tasks/support/Query';
import {
  GeoType,
  MappableGeoType,
  SearchableGeoType,
} from '../typings/metadataModels';

import * as QueryUtils from '../util/queryUtils';
import {
  BaseGeo,
  BaseGeoWithGeometry,
  DetailedGeo,
  GeographyPartitions,
  GeographyPartitionsMap,
} from '../typings/appModels';
import { fillStringTemplate } from '../util/stringUtils';
import {
  isGeoTypeMappable,
  isGeoTypeSearchable,
  MetadataService,
} from './metadataService';

type ParentGeosMap = Record<string, DetailedGeo[]>;

export default class GeographyService {
  static async findGeography(
    geoType: MappableGeoType,
    geoId: string
  ): Promise<BaseGeo | undefined> {
    // Relying on validateGeographies which returns the same set of outfields as search for bookmarks as well.
    // Will have to check if this leads to any errors when we implement bookmarkController
    // const whereClause = `${geoType.GeoIdField} = '${geoId}'`;
    const foundGeographies = await GeographyService.validateGeographies(
      geoType,
      [geoId]
    );
    if (foundGeographies.length !== 0) {
      return foundGeographies[0];
    }
    return undefined;
  }

  static async searchGeographies(
    geoType: SearchableGeoType,
    searchText: string
  ): Promise<BaseGeo[]> {
    const whereClause = GeographyService.createWhereClause(
      geoType.SearchFields,
      searchText
    );
    return GeographyService.searchGeographyByQuery(geoType, whereClause);
  }

  // Containing geography should return a geography in exactly the same format as when doing a search
  static async findContainingGeography(
    geoType: MappableGeoType,
    point: Point,
    zoomLevel?: number
  ): Promise<BaseGeo[]> {
    return GeographyService.searchGeographyByGeometry(
      geoType,
      point,
      zoomLevel
    );
  }

  static async findIntersectingGeographies(
    geoType: MappableGeoType,
    geometry: Polygon,
    zoomLevel: number,
    returnGeometry = false
  ): Promise<BaseGeo[]> {
    return GeographyService.searchGeographyByGeometry(
      geoType,
      geometry,
      zoomLevel,
      returnGeometry
    );
  }

  static async findParentGeographies(
    geographiesMap: GeographyPartitionsMap
  ): Promise<ParentGeosMap> {
    const parentQueryPromises: Promise<ParentGeosMap>[] = [];
    const allParents: ParentGeosMap = {};
    Object.keys(geographiesMap).forEach((geoTypeId) => {
      const geoType = MetadataService.getGeoType(geoTypeId);
      parentQueryPromises.push(
        GeographyService.findParents(
          geoType as MappableGeoType,
          geographiesMap[geoTypeId]
        )
      );
    });
    const results = await Promise.all(parentQueryPromises);
    results.forEach((parentGeoTypesMap) => {
      Object.entries(parentGeoTypesMap).forEach(
        ([parentGeoTypeId, parentGeoType]) => {
          if (allParents[parentGeoTypeId] === undefined) {
            allParents[parentGeoTypeId] = parentGeoType;
          } else {
            const parentGeos = parentGeoType;
            parentGeos.forEach((parentGeo) => {
              if (
                !allParents[parentGeoTypeId].some(
                  (aGeo) => aGeo.id === parentGeo.id
                )
              ) {
                allParents[parentGeoTypeId].push(parentGeo);
              }
            });
          }
        }
      );
    });
    return allParents;
  }

  static async findGeographyGeometry(
    geography: BaseGeo,
    zoomLevel?: number
  ): Promise<BaseGeoWithGeometry> {
    const { geoType } = geography;
    const mappableGeoType = geoType as MappableGeoType;
    const serviceUrl = GeographyService.getServiceURL(
      mappableGeoType,
      zoomLevel
    );
    const whereClause = `${geoType.GeoIdField}='${geography.id}'`;
    const query = QueryUtils.createQuery(
      true,
      GeographyService.getSearchOutfields(geoType),
      whereClause
    );
    const geosWithGeometry =
      await GeographyService.queryBaseGeographyWithGeometry(
        mappableGeoType,
        serviceUrl,
        query
      );
    return geosWithGeometry[0];
  }

  static async findGeographyPartitionsForMap(
    geoType: MappableGeoType,
    extent: Extent,
    zoomLevel: number,
    resolution: number
  ): Promise<GeographyPartitionsMap> {
    const geoTypePartitions: GeographyPartitionsMap = {};
    const query = QueryUtils.createQuery(
      true,
      GeographyService.getPartitionOutFields(geoType),
      undefined,
      extent,
      geoType.TigerFIPSFields,
      resolution
    );
    console.log(GeographyService.getServiceURL(geoType, zoomLevel));
    const [features] = await QueryUtils.runQuery(
      GeographyService.getServiceURL(geoType, zoomLevel),
      query,
      { pageSize: 1000, fetch: 'ALL' }
    );

    const allPartitions = GeographyService.partitionSpatialFeatures(
      geoType,
      features,
      geoType.TigerPartitionFields
    );
    geoTypePartitions[geoType.ID] = allPartitions;

    return geoTypePartitions;
  }

  static async findGeographyPartitionsForTable(geographiesMap: {
    [key: string]: BaseGeo[];
  }): Promise<GeographyPartitionsMap> {
    const geoTypePartitions: GeographyPartitionsMap = {};
    const geoTypePromises = Object.keys(geographiesMap).map(
      async (geoTypeId) => {
        const geoType = MetadataService.getGeoType(geoTypeId);
        if (isGeoTypeMappable(geoType)) {
          const geoIds = geographiesMap[geoTypeId].map((geo) => geo.id);
          const whereClause = QueryUtils.createInSQLQuery(
            geoType.GeoIdField,
            geoIds,
            true
          );
          const query = QueryUtils.createQuery(
            false,
            GeographyService.getPartitionOutFields(geoType),
            whereClause,
            undefined,
            geoType.TigerFIPSFields
          );
          const [features] = await QueryUtils.runQuery(
            GeographyService.getServiceURL(geoType, 1),
            query,
            { pageSize: 1000, fetch: 'ALL' }
          );
          const allPartitions = GeographyService.partitionSpatialFeatures(
            geoType,
            features,
            geoType.TigerPartitionFields
          );
          geoTypePartitions[geoTypeId] = allPartitions;
        } else {
          geoTypePartitions[geoTypeId] = [
            geographiesMap[geoTypeId] as DetailedGeo[],
          ];
        }
      }
    );
    await Promise.all(geoTypePromises);
    return geoTypePartitions;
  }

  // Function to query the peers of the selected geography, constrained by the closest immediate parent geolevel
  static async findGeographyPartitionPeers(
    parentGeographiesMap: {
      [key: string]: BaseGeo[];
    },
    selectedGeographiesMap: GeographyPartitionsMap
  ): Promise<GeographyPartitionsMap> {
    const geoLevelOrder = [
      'nation',
      'state',
      'metro',
      'county',
      'places',
      'zcta',
      'tract',
    ];
    // Using parent geographies, find the lowest level geography applicable
    const parentKey = Object.keys(parentGeographiesMap).reduce(
      (acc, parentGeo) =>
        geoLevelOrder.indexOf(parentGeo) > geoLevelOrder.indexOf(acc)
          ? parentGeo
          : acc,
      // Default to nation since every geography has this as a parent
      'nation'
    );

    // Get the first parent in the parent geography list
    const [targetParentGeography] = parentGeographiesMap[parentKey];

    const geoTypePartitions: GeographyPartitionsMap = {};
    const geoTypePromises = Object.keys(selectedGeographiesMap).map(
      (peerGeoTypeId) => {
        const peerGeoType = MetadataService.getGeoType(peerGeoTypeId);

        // The goal is now to get all peer geographies contained within the extent of the lone parent geography
        const parentGeoTypeId: string = targetParentGeography.geoType.ID;
        const parentGeoType = MetadataService.getGeoType(parentGeoTypeId);
        if (isGeoTypeMappable(peerGeoType)) {
          // Set up base where clause using parent geotype id
          let whereClause = `${parentGeoType.ID.toUpperCase()} = '${
            targetParentGeography.id
          }'`;

          // If parent geotype is nation, select all children
          if (parentGeoType.ID === 'nation') {
            whereClause = `0 = 0`;
          }

          // NOTE: This might just be a data issue we need to resolve, but tracts has "COUNTY" stored as 3 digits instead of the full 5 digits.
          // This forces us to break up the where clause like below.
          // getting data for tracts
          if (parentGeoType.ID === 'county') {
            const stateDigits = targetParentGeography.id.substring(0, 2);
            const countyDigits = targetParentGeography.id.substring(2, 5);
            whereClause = `STATE = '${stateDigits}' AND COUNTY = '${countyDigits}'`;
          }

          // Set up query to find peers
          const query = QueryUtils.createQuery(
            false,
            GeographyService.getPartitionOutFields(peerGeoType),
            whereClause,
            undefined,
            peerGeoType.TigerFIPSFields
          );

          // Run a query to get all peer geographies within the parent geolevel
          return QueryUtils.runQuery(
            GeographyService.getServiceURL(peerGeoType, 1),
            query,
            {
              pageSize: 1000,
              fetch: 'ALL',
            }
          ).then(([features]) => {
            const allPartitions = GeographyService.partitionSpatialFeatures(
              peerGeoType,
              features,
              peerGeoType.TigerPartitionFields
            );
            geoTypePartitions[peerGeoTypeId] = allPartitions;
          });
        }
        /*
          geoTypePartitions[peerGeoTypeId] = [
            selectedGeographiesMap[peerGeoTypeId] as DetailedGeo[],
          ];
          */
        return undefined;
      }
    );
    await Promise.all(geoTypePromises);

    // Get array of all peer geographies back that will need to be populated with data.
    return geoTypePartitions;
  }

  static async validateGeographies(
    geoType: MappableGeoType,
    geoIds: string[]
  ): Promise<BaseGeo[]> {
    const whereClause = QueryUtils.createInSQLQuery(
      geoType.GeoIdField,
      geoIds,
      true
    );
    return GeographyService.searchGeographyByQuery(geoType, whereClause);
  }

  static getServiceURL(geoType: MappableGeoType, zoomLevel?: number): string {
    const serviceEndpoints = geoType.ServiceEndpoints.map((ServiceEndpoint) =>
      fillStringTemplate(
        {
          generalizedGeoDataAPIUrl:
            ENV_CONFIG.envConfig.generalizedGeoDataAPIUrl,
        },
        ServiceEndpoint
      )
    );
    // If zoom level is defined then this function is most likely being called from map
    if (zoomLevel !== undefined) {
      const zoomLevelIndex = geoType.drawingProperties.ZoomLevels.findIndex(
        (zoomLevelRange) =>
          zoomLevel >= zoomLevelRange.from && zoomLevel <= zoomLevelRange.to
      );
      return zoomLevelIndex === -1
        ? serviceEndpoints[0]
        : serviceEndpoints[zoomLevelIndex];
    }
    // else it is baing called from search
    if (isGeoTypeSearchable(geoType)) {
      return serviceEndpoints[geoType.ServiceIndexForSearch];
    }
    // if all fails (which should never happe) return the first endpoint
    return serviceEndpoints[0];
  }

  /* ***********************************************************************************************************************
   * Geography Service Internal Functions
   ************************************************************************************************************************ */
  private static partitionSpatialFeatures(
    geoType: GeoType,
    features: Graphic[],
    partitionFields?: string[]
  ): GeographyPartitions {
    console.log(partitionFields);
    if (partitionFields === undefined) {
      return [
        features.map((feature) =>
          GeographyService.buildGeography(geoType, feature)
        ),
      ];
    }
    const partitionMap = features.reduce((agg, feature) => {
      // Using a serialized key as a key to partition
      // this lets us get away from RxJS which was being used just in this function
      const partitionKey = partitionFields
        .map((partitionField) => feature.attributes[partitionField])
        .join('-');
      if (!Object.keys(agg).includes(partitionKey)) {
        // eslint-disable-next-line no-param-reassign
        agg[partitionKey] = [];
      }
      agg[partitionKey].push(GeographyService.buildGeography(geoType, feature));
      return agg;
    }, {} as Record<string, DetailedGeo[]>);
    return Object.values(partitionMap);
  }

  private static async findParents(
    geoType: MappableGeoType,
    allPartitions: GeographyPartitions
  ): Promise<ParentGeosMap> {
    const geographies: DetailedGeo[] = [];
    for (let i = 0; i < allPartitions.length; i += 1) {
      for (let j = 0; j < allPartitions[i].length; j += 1) {
        geographies.push(allPartitions[i][j]);
      }
    }
    const parentMap: ParentGeosMap = {};
    const fipsPromises = geoType.CompareToTypes.map((compareToTypeId) => {
      // eslint-disable-next-line no-async-promise-executor
      const fipsPromise = new Promise<void>(async (resolve): Promise<void> => {
        const compareToGeoType = MetadataService.getGeoType(compareToTypeId);
        const fipsIds: string[][] = [];
        geographies.forEach((geography) => {
          // Introduce a fake 'Nation' FIPS into the geography
          if (
            compareToGeoType.DefaultGeoId &&
            compareToGeoType.DefaultGeoName
          ) {
            geography.attributes[compareToGeoType.TigerIdField] =
              compareToGeoType.DefaultGeoId;
          }

          const hasAll = compareToGeoType.TigerFIPSFields.every(
            (compareToGeoTypeField) =>
              geography.attributes[compareToGeoTypeField]
          );
          if (hasAll) {
            const allFips: string[] = [];
            compareToGeoType.TigerFIPSFields.forEach(
              (compareToGeoTypeField) => {
                allFips.push(
                  geography.attributes[compareToGeoTypeField] as string
                );
              }
            );
            fipsIds.push(allFips);
            // }
          }
        });
        if (fipsIds.length > 0 || isGeoTypeMappable(compareToGeoType)) {
          // TODO - Handle errors in findGeographyByFIPS, error handling should be moved upstream.
          const parentGeos = await GeographyService.findGeographyByFIPS(
            compareToGeoType,
            fipsIds
          );
          parentMap[compareToGeoType.ID] = parentGeos;
          resolve();
        } else {
          resolve();
        }
      });
      return fipsPromise;
    });
    await Promise.all(fipsPromises);
    return parentMap;
  }

  private static async findGeographyByFIPS(
    geoType: GeoType,
    fipsIds: string[][]
  ): Promise<DetailedGeo[]> {
    const fipsPromises: Promise<DetailedGeo[]>[] = [];
    // Instead of cheking for the presence of id and default name, check if the compare to geo type is mappable
    // if (geoType.DefaultGeoId && geoType.DefaultGeoName) {
    if (isGeoTypeMappable(geoType)) {
      const whereClauses: string[] = [];
      fipsIds.forEach((fipsRow, rowIndex) => {
        const rowWhereComponents: string[] = [];
        geoType.TigerFIPSFields.forEach((field, colIndex) => {
          const rowWhereComponent = `${field} = '${fipsIds[rowIndex][colIndex]}'`;
          rowWhereComponents.push(rowWhereComponent);
        });
        const andedFIPS = `(${rowWhereComponents.join(' AND ')})`;
        if (whereClauses.indexOf(andedFIPS) === -1) {
          whereClauses.push(andedFIPS);
        }
      });
      const whereClause = whereClauses.join(' OR ');
      const outFields = GeographyService.getPartitionOutFields(geoType);
      const serviceUrl = GeographyService.getServiceURL(geoType);
      const query = QueryUtils.createQuery(false, outFields, whereClause);
      const promise = QueryUtils.runQuery(serviceUrl, query, {
        pageSize: 1000,
        fetch: 'ALL',
      }).then(([features]) =>
        features
          .map((feature) => GeographyService.buildGeography(geoType, feature))
          .sort(GeographyService.compareGeos)
      );

      fipsPromises.push(promise);
    } else {
      const feature = {
        attributes: {
          [geoType.GeoIdField]: geoType.DefaultGeoId,
          [geoType.DisplayField]: geoType.DefaultGeoName,
        },
      } as Graphic;
      fipsPromises.push(
        Promise.resolve([GeographyService.buildGeography(geoType, feature)])
      );
    }
    const fipsQueryResult = await Promise.all(fipsPromises);
    return fipsQueryResult.reduce((agg, item) => {
      // eslint-disable-next-line no-param-reassign
      agg = [...agg, ...item];
      return agg;
    }, [] as DetailedGeo[]);
  }

  private static async searchGeographyByQuery(
    geoType: MappableGeoType,
    whereClause: string
  ): Promise<BaseGeo[]> {
    const serviceUrl = GeographyService.getServiceURL(geoType);
    const query = QueryUtils.createQuery(
      false,
      GeographyService.getSearchOutfields(geoType),
      whereClause
    );
    return GeographyService.queryBaseGeography(geoType, serviceUrl, query);
  }

  private static async searchGeographyByGeometry(
    geoType: MappableGeoType,
    geometry: Geometry,
    zoomLevel?: number,
    returnGeometry = false
  ): Promise<BaseGeo[]> {
    const serviceUrl = GeographyService.getServiceURL(geoType, zoomLevel);
    // const query = this.queryUtils.createQuery(false, GeographyService.getSearchOutfields(geoType), undefined, geometry);
    const query =
      returnGeometry === true
        ? QueryUtils.createQuery(
            true,
            GeographyService.getSearchOutfields(geoType),
            undefined,
            geometry
          )
        : QueryUtils.createQuery(
            false,
            GeographyService.getSearchOutfields(geoType),
            undefined,
            geometry
          );
    return returnGeometry === true
      ? GeographyService.queryBaseGeographyWithGeometry(
          geoType,
          serviceUrl,
          query
        )
      : GeographyService.queryBaseGeography(geoType, serviceUrl, query);
  }

  // Geography
  private static async queryBaseGeography(
    geoType: MappableGeoType,
    serviceUrl: string,
    query: Query
  ): Promise<BaseGeo[]> {
    const [features] = await QueryUtils.runQuery(serviceUrl, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });
    return features
      .map((feature) => GeographyService.buildBaseGeoRecord(geoType, feature))
      .sort(GeographyService.compareGeos);
  }

  private static buildGeography(
    geoType: GeoType,
    feature: Graphic
  ): DetailedGeo {
    const featureAttributes = feature.attributes;
    const geography = {
      id: featureAttributes[geoType.GeoIdField],
      name: `${featureAttributes[geoType.DisplayField]}${
        geoType.StateField === undefined
          ? ''
          : `, ${MetadataService.getStateNameByFIPS(
              featureAttributes[geoType.StateField]
            )}`
      }`,
      geoType,
      attributes: featureAttributes,
    };
    return geography;
  }

  private static buildBaseGeoRecord(
    geoType: GeoType,
    feature: Graphic
  ): BaseGeo {
    const featureAttributes = feature.attributes;
    const geography: BaseGeo = {
      id: featureAttributes[geoType.GeoIdField],
      name: `${featureAttributes[geoType.DisplayField]}${
        geoType.StateField === undefined
          ? ''
          : `, ${MetadataService.getStateNameByFIPS(
              featureAttributes[geoType.StateField]
            )}`
      }`,
      geoType,
    };
    return geography;
  }

  // GeographyWithGeometry
  private static async queryBaseGeographyWithGeometry(
    geoType: MappableGeoType,
    serviceUrl: string,
    query: Query
  ): Promise<BaseGeoWithGeometry[]> {
    const [features] = await QueryUtils.runQuery(serviceUrl, query, {
      pageSize: 1000,
      fetch: 'ALL',
    });

    return features
      .map((feature) =>
        GeographyService.buildBaseGeoWithGeometryRecord(geoType, feature)
      )
      .sort(GeographyService.compareGeos);
  }

  private static buildBaseGeoWithGeometryRecord(
    geoType: GeoType,
    feature: Graphic
  ): BaseGeoWithGeometry {
    const featureAttributes = feature.attributes;
    const geography: BaseGeoWithGeometry = {
      id: featureAttributes[geoType.GeoIdField],
      name: `${featureAttributes[geoType.DisplayField]}${
        geoType.StateField === undefined
          ? ''
          : `, ${MetadataService.getStateNameByFIPS(
              featureAttributes[geoType.StateField]
            )}`
      }`,
      geoType,
      geometry: feature.geometry,
    };
    return geography;
  }

  private static getSearchOutfields(geoType: GeoType): string[] {
    let outFields = [geoType.GeoIdField, geoType.DisplayField];
    if (geoType.StateField !== undefined) {
      outFields = [...outFields, geoType.StateField];
    }
    return outFields;
  }

  private static getPartitionOutFields(geoType: GeoType): string[] {
    let outFields = [
      geoType.GeoIdField,
      geoType.DisplayField,
      geoType.TigerIdField,
      ...geoType.TigerFIPSFields,
    ];
    if (geoType.StateField !== undefined) {
      outFields = [...outFields, geoType.StateField];
    }
    if (geoType.TigerPartitionFields !== undefined) {
      outFields = [...outFields, ...geoType.TigerPartitionFields];
    }
    return outFields;
  }

  private static createWhereClause(
    searchFields: string[],
    searchText: string
  ): string {
    // TJ - CBDI-804
    // Now that we are accepting apostrophes (single quotes) in the names,
    // we should escape them when creating where clause
    const whereClause = searchFields
      .map(
        (searchField) =>
          `LOWER(${searchField}) like '${searchText
            .replace("'", "''")
            .toLowerCase()}%'`
      )
      .join(' or ');
    return whereClause;
  }

  private static compareGeos(a: BaseGeo, b: BaseGeo): number {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
}
