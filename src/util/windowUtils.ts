export class WindowUtils {
  private static instance: WindowUtils;

  static getInstance(): WindowUtils {
    if (WindowUtils.instance === undefined) {
      WindowUtils.instance = new WindowUtils();
      // Some global variables are used by third-pary code and we simply keep the same reference
      WindowUtils.digitalData = window.digitalData || WindowUtils.digitalData;
    }
    return WindowUtils.instance;
  }

  static digitalData: any[] = [];

  static isMobileView(): boolean {
    return window.isMobileView;
  }

  static isReportView(): boolean {
    return window.isReportView;
  }

  static createHashedUrl(hashComponents: Record<string, string>): string {
    const hashString = new URLSearchParams(hashComponents).toString();
    return `${WindowUtils.getPath()}#${hashString}`;
  }

  static getHash(): Record<string, string> {
    const hashComponents: Record<string, string> = {};
    const appLocation = window.location.href;
    const hashIndex = appLocation.indexOf('#');
    if (hashIndex !== -1) {
      const urlHashPart = appLocation.substring(hashIndex + 1).trim();
      const hashString = urlHashPart === '' ? undefined : urlHashPart;
      if (hashString !== undefined) {
        const urlSearchParams = new URLSearchParams(hashString);
        urlSearchParams.forEach((value, key) => {
          hashComponents[key] = value;
        });
      }
    }
    return hashComponents;
  }

  static getPath(): string {
    const appLocation = window.location.href;
    const hashIndex = appLocation.indexOf('#');
    let appPath = appLocation;
    if (hashIndex !== -1) {
      appPath = appLocation.substring(0, hashIndex);
    }
    return appPath;
  }

  static setHash = (hashComponents: Record<string, string>): void => {
    const hashString = WindowUtils.createHashedUrl(hashComponents);
    const historyRef = window.history;
    historyRef.pushState(null, window.document.title, hashString);
  };

  static setExecutionEnv(): void {
    const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
    const isMobileDimensions =
      window.innerHeight > window.innerWidth || window.innerWidth <= 1024;

    window.isMobileView = isMobileDevice && isMobileDimensions;

    const { view } = WindowUtils.getHash();

    window.isReportView =
      view !== undefined && (view === 'report' || view === 'regionreport');
  }
}
