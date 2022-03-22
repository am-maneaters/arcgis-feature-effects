import { AppConfig } from '../typings/configModels';
import * as LogUtils from './logUtils';

type ResponseHeader = string[];
type ResponseRow = (string | null)[];
type ResponseRecord = [ResponseHeader, ...ResponseRow[]];

type DataAPIRequest = LogUtils.RequestInfo & {
  request: Promise<ResponseRecord>;
  requestTime: Date;
};

type FetchFilters = {
  geoTypeFilters: ((geoType: string, url: URL) => string)[];
  variablesFilters: ((variables: string[]) => string[])[];
  geoFormatFilters: ((piece: string) => string)[];
  responseFilters: ((
    apiRequest: DataAPIRequest,
    headers: ResponseHeader,
    row: ResponseRow
  ) => ResponseRow)[];
};

// Replace geoTypes based on request path information and replacements set in the application
// configuration file
function geoTypeReplacementGenerator(appConfig: AppConfig) {
  return (geoTypeId: string, url: URL): string => {
    const { geoTypeReplacementsForPath } = appConfig.dataAPIClientConfig;
    if (geoTypeReplacementsForPath[url.pathname]) {
      const geoTypes = geoTypeReplacementsForPath[url.pathname];
      if (geoTypes && geoTypes[geoTypeId]) {
        return geoTypes[geoTypeId];
      }
    }
    return geoTypeId;
  };
}

// Modify the QWI response data for specific flags that should *not* be treated as suppressed values
function qwiDataResponseFilter(
  apiRequest: DataAPIRequest,
  headers: ResponseHeader,
  row: ResponseRow
): ResponseRow {
  // DO nothing for non-QWI queries
  if (
    apiRequest.url.indexOf('/data/timeseries/qwi/sa') === -1 &&
    apiRequest.url.indexOf('/data/timeseries/qwi/se') === -1
  ) {
    return row;
  }

  // Convert any 's' header flag values from '1' and '9 to empty values
  const newRow = headers.map((header, index) => {
    if (header[0] !== 's') {
      return row[index];
    }

    // const keysToModify: {[header: string]: boolean} = {};
    const flagValue = row[index];
    if (flagValue === '1' || flagValue === '9') {
      return '';
    }

    // If the flag was not a '1' or '9', then we will modify the value as well.
    return flagValue;
  });

  return newRow;
}

export class ClientUtils {
  private static instance: ClientUtils;

  private readonly filters: FetchFilters;

  private constructor(private readonly appConfig: AppConfig) {
    // Hoist this into the appConfig later in order to abstract out different
    // fetch strategies.
    const geoTypeReplacementsForPath = geoTypeReplacementGenerator(appConfig);
    this.filters = {
      geoTypeFilters: [geoTypeReplacementsForPath],
      variablesFilters: [],
      geoFormatFilters: [],
      responseFilters: [qwiDataResponseFilter],
    };
  }

  static getInstance(appConfig: AppConfig): ClientUtils {
    if (ClientUtils.instance === undefined) {
      ClientUtils.instance = new ClientUtils(appConfig);
    }
    return ClientUtils.instance;
  }

  // Based on https://stackoverflow.com/a/41015840/332406
  private static interpolate(template: string, params: object): string {
    const names = Object.keys(params);
    let output = template;
    names.forEach((name) => {
      const token = `\${${name}}`;
      output = output.split(token).join(params[name]);
    });
    return output;
  }

  fetchData(
    canonicalUrl: string,
    variables: string[],
    inputGeoTypeId: string,
    geoIds: string[],
    inClause?: string,
    geoFormat?: string
  ): Promise<unknown> {
    // Keep track of any data changes that need to be undone in the response
    const headerReverseMap: Record<string, string> = {};

    /**
     * This is where we change the host part of the URL.
     * This is needed some times when the official data API does not yet have the latest data
     * but we need to test the app against their beta endpoint which is only accessible within Census n/w.
     * Having this in place circumvents us from having the change the actual metadata Excel file which otherwise
     * add another risk.
     */
    // Replace the host name to easily switch between beta data API and production without changing the metadata.
    const parsedUrl = new URL(canonicalUrl);
    const apiUrl = canonicalUrl.replace(
      parsedUrl.host,
      ENV_CONFIG.envConfig.dataAPIHost
    );

    // Apply any filters to the geoType
    let geoTypeId = inputGeoTypeId;
    this.filters.geoTypeFilters.forEach((filter) => {
      geoTypeId = filter(geoTypeId, parsedUrl);
    });

    // See if the geoType header was modified
    if (geoTypeId !== inputGeoTypeId) {
      headerReverseMap[geoTypeId] = inputGeoTypeId;
    }

    /**
     * Some programs require the geo type to be uppercased. The following implementation passes both the regular case
     * and the upper cased geo type to the string template to create the "for" part of the url. The geo format parameter
     * which is one of the following forms then returns the appropriate URL:
     * "&for=${geotypeId}:${geoIds}?&in=${inClause}"
     * or,
     * "&for=${GEOTYPEID}:${geoIds}?&in=${inClause}"
     * The legacy implementation also adds the in clause which limits the parent geo types to the ones specified.
     * Need to revisit.
     */
    let geoTypeUrlParam = '';

    // Following replacement implementation does not do any modification to the case
    // etc. and simply fills in the required parameters based on inputs to this function.
    if (geoFormat && geoFormat.length > 0) {
      // Split up into pieces and compose separately
      const geoFormatPieces = geoFormat.split('?');
      const geoTypeUrlParamPieces: string[] = [];

      // Process each in turn and build up the geotype url parameters
      geoFormatPieces.forEach((_piece) => {
        // Apply any filters to the piece
        let piece = _piece;
        this.filters.geoFormatFilters.forEach((filter) => {
          piece = filter(piece);
        });

        // Create the GeoType IDs

        if (
          (piece.startsWith('&for=') || piece.startsWith('&${GEOTYPEID}')) &&
          geoTypeId &&
          geoIds.length > 0
        ) {
          // Special Catch for "nation"/"us" geotype
          if (geoTypeId === 'us' && geoIds[0] === '') {
            geoIds[0] = '1';
          }

          // Pass in all of the different geoTypeId variations
          geoTypeUrlParamPieces.push(
            ClientUtils.interpolate(piece, {
              geoTypeId,
              geotypeId: geoTypeId,
              GEOTYPEID: geoTypeId.toUpperCase(),
              geoIds,
            })
          );
        }

        // Create the 'in' clause
        if (piece.startsWith('&in=') && inClause) {
          geoTypeUrlParamPieces.push(
            ClientUtils.interpolate(piece, {
              inClause,
            })
          );
        }
      });

      // All of the URL pieces are already prefixed with an ampersand, so no need to add one
      geoTypeUrlParam = geoTypeUrlParamPieces.join('');
    } else if (geoIds.length > 0) {
      geoTypeUrlParam = `&for=${geoTypeId}:${geoIds.join(',')}`;
      if (inClause !== undefined) {
        geoTypeUrlParam = `${geoTypeUrlParam}&in=${inClause}`;
      }
    }

    // Apply any outside filters to the variables list
    let filteredVariables = variables;
    this.filters.variablesFilters.forEach((filter) => {
      filteredVariables = filter(filteredVariables);
    });

    const url = `${
      apiUrl.indexOf('?') === -1 ? `${apiUrl}?` : `${apiUrl}&`
    }get=${filteredVariables.join(',')}${geoTypeUrlParam}`;

    const apiRequest = this.createRequest(url, false);
    return this.createResponse(
      apiRequest,
      headerReverseMap /* , geoTypeId, originalVars, modifyQWIFlags, modifyQWIValues */
    );
  }

  // Internal functions
  private createRequest(dataApiUrl: string, useCors: boolean): DataAPIRequest {
    let usingProxy = false;
    let url: string;
    let deferredRequest: Promise<unknown>;
    if (dataApiUrl.length < this.appConfig.dataAPIClientConfig.urlLengthLimit) {
      url = `${dataApiUrl}&key=${ENV_CONFIG.envConfig.censusAPIKey}`;
      deferredRequest = ClientUtils.httpGet(url);
    } else {
      usingProxy = true;
      deferredRequest = ClientUtils.httpPost(
        ENV_CONFIG.envConfig.dataAPIProxyUrl,
        dataApiUrl,
        useCors
      );
    }
    return {
      request: deferredRequest,
      url: dataApiUrl,
      usingProxy,
      requestTime: new Date(),
    } as DataAPIRequest;
  }

  private async createResponse(
    apiRequest: DataAPIRequest,
    headerReverseMap: Record<string, string>
  ): Promise<unknown> {
    const requestDetails = {
      url: apiRequest.url,
      usingProxy: apiRequest.usingProxy,
    };
    try {
      const rawdata = await apiRequest.request;

      // A 204 response will return an empty array, check for that here before attempting to process
      // the headers
      if (rawdata.length === 0) {
        return rawdata;
      }

      const [headers, ...body] = rawdata;

      // Fix to resolve issue where ZBP returns 'zip code' instead of 'zip code tabulation area' which resulted in gray map
      // for ZBP map variables on zip code geolevel
      if (headers.indexOf('zip code') > -1) {
        const zipCodeIndex = headers.indexOf('zip code');

        headers[zipCodeIndex] = 'zip code tabulation area';
      }

      // This is where we are reverting the geo type back to what the application originally called the
      // client utils with - so that the calling code is unaware of the change that we made on-the-fly.
      const finalHeaders = headers.map((h) =>
        h in headerReverseMap ? headerReverseMap[h] : h
      );

      // Some data sources, like QWI, need to have some of their data reinterpreted before passing
      // it back to the called.  Run a series of data response filters over the body.
      let finalBody = body;
      this.filters.responseFilters.forEach((filter) => {
        finalBody = finalBody.map((row) =>
          filter(apiRequest, finalHeaders, row)
        );
      });

      const data: ResponseRecord = [finalHeaders, ...finalBody];

      const timeDelta =
        new Date().getMilliseconds() - apiRequest.requestTime.getMilliseconds();
      LogUtils.logServiceSuccess(
        'Data API',
        apiRequest.requestTime.toString(),
        timeDelta,
        requestDetails
      );
      return data;
    } catch (error) {
      LogUtils.logServiceError(
        'Data API',
        apiRequest.requestTime.toString(),
        requestDetails,
        error
      );
      throw error;
    }
  }

  private static async httpGet(dataAPIUrl: string): Promise<unknown> {
    const response = await fetch(dataAPIUrl);
    if (response.ok === true) {
      if (response.status === 204) {
        return [];
      }
      const jsonResponse = await response.json();
      return jsonResponse;
    }

    throw new Error(`${response.status} (${response.statusText})`);
  }

  // useCors is only used for testing POST requests.
  // In actual implementation (fetchData), it is set to false because proxy will always be on the same domain.
  private static async httpPost(
    proxyUrl: string,
    dataAPIUrl: string,
    useCors = false
  ): Promise<unknown> {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      mode: useCors === true ? 'cors' : 'no-cors',
      headers: {
        // TJ - Change the content type to text/plain because we are simply POSTING the URL as body
        // and reading it on the proxy without serializing/deserializing to JSON at any step.
        'Content-Type': 'text/plain',
      },
      body: dataAPIUrl,
      // Include credentials header.
      // This is to prevent a bug in FF 60.9 where it seems like FF is trying to pre-flight the request although the content type is set to "text/plain"
      // and when the actual request is made to the proxy the authorization header is missing and hence IIS return 401.
      // Works fine in all other browsers - Chrome/Edge/IE 11.
      // This looks like a low-risk change because:
      // 1) Authorization is only ever enabled on dcdev - all other CBB sites are public
      // 2) The bug seems to related to only older versions of FF
      credentials: 'include',
    });
    // CBB proxy returns only status codes 200 and 500.
    // When it gets a 204 from Census API it returns an empty array and status code 200.
    // For all status codes other than 200 and 204 it returns 500.
    if (response.ok === true) {
      const jsonResponse = await response.json();
      return jsonResponse;
    }

    throw new Error(`${response.status} (${response.statusText})`);
  }
}
