import { UserUploadedData } from '../typings/appModels';

/**
 * Most of the functionality from the old JS class was refectored into
 * the UserFetcher support class.  However, we still need a singleton
 * to attach the uploaded user data to.
 */
export class UserDataClientUtils {
  private static instance: UserDataClientUtils;

  private userData: UserUploadedData = {
    attributeData: [[]],
    dataVariables: [],
  };

  static getInstance(): UserDataClientUtils {
    if (UserDataClientUtils.instance === undefined) {
      UserDataClientUtils.instance = new UserDataClientUtils();
    }
    return UserDataClientUtils.instance;
  }

  public setUploadedUserData(userData: UserUploadedData): void {
    this.userData = userData;
  }

  public getUploadedUserData(): UserUploadedData {
    return this.userData;
  }
}
