import { ApiRecord, FetchDataParameters } from './serviceTypes';

export interface DataFetcher {
  fetchData(params: FetchDataParameters): Promise<ApiRecord[]>[];
}
