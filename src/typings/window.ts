import { AppConfig } from '../typings/configModels';

export {};
declare global {
  interface Window {
    app: any;
    appConfig: AppConfig;

    digitalData: any[];
    File: {
      new (
        fileBits: BlobPart[],
        fileName: string,
        options?: FilePropertyBag | undefined
      ): File;
      prototype: File;
    };
    FileList: {
      new (): FileList;
      prototype: FileList;
    };
    FileReader: {
      new (): FileReader;
      prototype: FileReader;
      readonly DONE: number;
      readonly EMPTY: number;
      readonly LOADING: number;
    };
    isMobileView: boolean;
    isReportView: boolean;
  }
  let ENV_CONFIG: {
    revisionStamp: string;
    envConfig: {
      generalizedGeoDataAPIUrl: string;
      industryAliasAPIUrl: string;
      dataAPIHost: string;
      censusAPIKey: string;
      dataAPIProxyUrl: string;
      industryDataAPIUrl: string;
    };
    editionConfig: {
      EDITION_TITLE: string;
      EDITION_PREFIX: string;
      releaseNumber: string;
      defaultPDFReportType: 'summary' | 'detailed';
      APP_TITLE: string;
    };
    buildNumber: string;
  };
}
