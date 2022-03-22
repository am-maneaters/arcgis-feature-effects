import Graphic from '@arcgis/core/Graphic';
import Geometry from '@arcgis/core/geometry/Geometry';
import Field from '@arcgis/core/layers/support/Field';
import QueryTask from '@arcgis/core/tasks/QueryTask';
import FeatureSet from '@arcgis/core/tasks/support/FeatureSet';
import Query from '@arcgis/core/tasks/support/Query';
import { chunk } from 'lodash-es';
import { GraphicLike } from '../typings/appModels';

export type QueryPagingParams = {
  pageSize?: number;
} & (
  | // How many records to fetch per page
  { fetch: 'ALL' } // Fetch all pages
  | { fetch: 'FIRST' } // Fetch only the first page
  | { fetch: 'MAX'; pageCount: number }
); // Fetch at most MAX pages

const CBB_FIELD_TYPES = [
  'small-integer',
  'integer',
  'single',
  'double',
  'long', // Numerics
  'string', // String
];

const SQL_NO_OP = '1=1';

const ALL_FIELDS = ['*'];

/**
 * Creates an IN clause to be used in an SQL query, e.g. name IN ('name1', 'name2').
 * Breaks the IN clause into multiple OR clauses because many databases limit the number
 * of elements that can be part of an IN query, e.g. (name IN ('name1', 'name2') OR name IN ('name3', 'name4')).
 * @param column Name of the column
 * @param values Values to be included in the IN clause
 * @param quoteValues true for string, false for numbers
 * @param chunkSize Optional maximum number of elements in each IN clause
 * @returns IN clause if list of values is not empty a SQL no-op ('1=1') otherwise
 */
export function createInSQLQuery<T extends string | number>(
  column: string,
  values: T[],
  quoteValues: T extends string ? true : false,
  chunkSize = 500
): string {
  if (values.length === 0) {
    return SQL_NO_OP;
  }

  // Split values up into chunks to reduce length of statements
  const queryClause = chunk(values, chunkSize)
    .map((valChunk) => {
      const slicedValuesList = valChunk
        .map((value) => (quoteValues ? `'${value}'` : value))
        .join(',');
      return `${column} IN (${slicedValuesList})`;
    })
    .join(' OR ');
  // Wrap query clause in parentheses to group values together in WHERE statement
  return `(${queryClause})`;
}

/**
 * Creates a query object that can be used either as a stand alone object to use directly with QueryTask or
 * in conjunction runQuery task of this class. Most of the input parameters are optional, which  if left
 * unspecified, are replaced by sensisble defaults. See parameter descriptions for default values used.
 * @param returnGeometry Boolean to indicate whether to fetch feature geometry or not
 * @param outFields List of fields to fetch (defaults to '*' if not unspecified)
 * @param whereClause Attribute filter query to apply (defaults to '1=1' if not specified)
 * @param filterGeometry Spatial filter to apply (input geometry must use web mercator)
 * @param orderByFields List of fields to order the results by (no deafult, ArcGIS will use OBJECTID if not specified)
 * @param resolution Maximum distance used for generalizing geometries returned by the query operation (no default)
 * @return Configured Typed Query object
 */

export function createQuery(
  returnGeometry: boolean,
  outFields: string[] = ALL_FIELDS,
  whereClause = SQL_NO_OP,
  filterGeometry?: Geometry,
  orderByFields: string[] = [],
  resolution?: number
): Query {
  const query = new Query();
  query.returnGeometry = returnGeometry;
  const filteredOutFields = outFields.filter((item) => item.trim() !== '');

  query.outFields =
    filteredOutFields.length > 0 ? filteredOutFields : ALL_FIELDS;
  query.where = whereClause.trim() === '' ? SQL_NO_OP : whereClause.trim();
  if (filterGeometry !== undefined) {
    query.geometry = filterGeometry;
  }
  const filteredOrderByFields = orderByFields.filter(
    (item) => item.trim() !== ''
  );
  query.orderByFields = filteredOrderByFields;

  if (resolution !== undefined) {
    query.maxAllowableOffset = resolution;
  }
  return query;
}

async function fetchPage(queryUrl: string, query: Query): Promise<FeatureSet> {
  const pageFeatureSet = new Promise<FeatureSet>((resolve, reject): void => {
    new QueryTask({
      url: queryUrl,
    })
      .execute(query)
      .then((value) => resolve(value), reject);
  });

  return pageFeatureSet;
}

/**
 * Runs a QueryTask against the given ArcGIS endpoint with the specified parameters.
 * Pages through ArcGIS results (based on specified PagingParameters), which is useful
 * when number of features that satisfy the query exeed ArcGIS's query limit.
 * @param queryUrl ArcGIS endpoint to run the query against
 * @param query Query object to set query parameters
 * @param pagingParams Paging parameters - see type definition at the top of this class
 * @return Promise that resolves with a list of all the features that satisfy the query
 */
export async function runQuery(
  queryUrl: string,
  query: Query,
  pagingParams: QueryPagingParams
): Promise<[Graphic[], Field[]]> {
  const pageSize = pagingParams.pageSize ?? 1000;
  const allFeatures: Graphic[] = [];
  let pagesFetched = 0;
  let pageFeatureSet: FeatureSet;
  let agsFields: Field[] = [];
  do {
    const clonedQuery = query.clone();
    clonedQuery.num = pageSize;
    clonedQuery.start = pagesFetched * pageSize;

    pageFeatureSet = await fetchPage(queryUrl, clonedQuery);

    allFeatures.push(...pageFeatureSet.features);
    if (pagesFetched === 0) {
      agsFields = pageFeatureSet.fields;
    }
    pagesFetched += 1;
  } while (
    pageFeatureSet.exceededTransferLimit &&
    (pagingParams.fetch === 'ALL' ||
      (pagingParams.fetch === 'MAX' && pagesFetched < pagingParams.pageCount))
  );
  return [allFeatures, agsFields];
}

function getFieldList(
  fieldInfo: Field[] /* , outFields: string[] */
): string[] {
  return fieldInfo
    .filter((queriedField) => CBB_FIELD_TYPES.includes(queriedField.type))
    .map((fieldToProcess) => fieldToProcess.name);
}

export function graphicsToGraphicLike(
  agsGraphics: Graphic[],
  fieldInfo: Field[]
): GraphicLike[] {
  const fieldsToProcess = getFieldList(fieldInfo);
  const graphicLikeFeatures = agsGraphics.map((feature) =>
    fieldsToProcess.reduce(
      (agg, fieldToProcess) => {
        if (fieldToProcess === 'geometry') {
          agg.geometry = feature.geometry;
        } else {
          agg.attributes[fieldToProcess] = feature.attributes[fieldToProcess];
        }
        return agg;
      },
      { attributes: {} } as GraphicLike
    )
  );
  return graphicLikeFeatures;
}
