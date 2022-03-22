import Extent from 'esri/geometry/Extent';
import {
  ClassifiedThematicData,
  ClickEvent,
  DrawEvent,
  MapCenter,
} from '../controllers/base/baseMapController';
import { DataVariableInfo } from '../controllers/base/dataVariableSelectionController';
import { DashboardVariablesInfo } from '../controllers/impl/dashboardDataVariablesSelectionControllerImpl';
import { FilterVariablesInfo } from '../controllers/impl/filterVariablesSelectionControllerImpl';
import {
  BaseGeo,
  CBBView,
  GeographyPartitionsMap,
  NAICSIndustryWithCoverage,
  PrimaryClassificationParameters,
  Region,
  SecondaryClassificationParameters,
  UploadInfo,
} from '../typings/appModels';
import { GeoType, MappableGeoType } from '../typings/metadataModels';

export type AppState = {
  view?: CBBView;
  industries?: NAICSIndustryWithCoverage[];
  clusterName?: string;
  geoType?: MappableGeoType;
  geography?: BaseGeo;
  primaryVariableInfo?: DataVariableInfo;
  secondaryVariableInfo?: DataVariableInfo;
  dashboardVariablesInfo?: DashboardVariablesInfo;
  mapExtent?: Extent;
  zoomLevel?: number;
  regionInfo?: Region;
  primaryClassificationParams?: PrimaryClassificationParameters;
  secondaryClassificationParams?: SecondaryClassificationParameters;
  isRegionEditingMode?: boolean;
};

export type CoreStateDelta = AppState & {
  initialExtent?: MapCenter;
  geographies?: BaseGeo[];
  repositionMap?: boolean;
  resolution?: number;
  isGeoTypeVisible?: boolean;
  uploadInfo?: UploadInfo;
  mapPartitions?: GeographyPartitionsMap;
  tablePartitions?: GeographyPartitionsMap;
  isFilterCriteriaChanged?: boolean;
  filterVariablesInfo?: FilterVariablesInfo;
  primaryThematicData?: ClassifiedThematicData;
  secondaryThematicData?: ClassifiedThematicData;
  mapEvent?: ClickEvent | DrawEvent;
  isUserInitiatedPan?: boolean;
};

export function checkObjectsInstantiated(
  obj1: unknown,
  obj2: unknown
): boolean {
  if ((!obj1 && obj2) || (obj1 && !obj2)) {
    return true;
  }
  return false;
}

export function checkObjectsDifferent<T>(
  obj1: T | undefined,
  obj2: T | undefined,
  props: string[]
): boolean {
  if (!obj1 && !obj2) return false;

  const objectsInstantiationDifferent = checkObjectsInstantiated(obj1, obj2);
  if (objectsInstantiationDifferent) {
    return true;
  }
  if (obj1 && obj2) {
    return props.some((prop: string | number) => obj1[prop] !== obj2[prop]);
  }
  return false;
}
export function isGeoTypeChanged(
  prevGeoType: GeoType | undefined,
  geoType: GeoType | undefined
): boolean {
  return checkObjectsDifferent(prevGeoType, geoType, ['ID']);
}

export function isMapClassificationChanged<
  T extends PrimaryClassificationParameters | SecondaryClassificationParameters
>(oldClassificationParams: T, classificationParams: T): boolean {
  const classificationMethodChanged = checkObjectsDifferent(
    oldClassificationParams.classificationScheme,
    classificationParams.classificationScheme,
    ['numRanges', 'classificationMethod']
  );
  const visualizationSchemeChanged =
    oldClassificationParams.visualizationSchemeId !==
    classificationParams.visualizationSchemeId;
  return classificationMethodChanged || visualizationSchemeChanged;
}

export function isGeographyChanged(
  prevGeography: BaseGeo | undefined,
  geography: BaseGeo
): boolean {
  return (
    isGeoTypeChanged(prevGeography?.geoType, geography?.geoType) ||
    checkObjectsDifferent(prevGeography, geography, ['id'])
  );
}

export function isMapExtentChanged(
  prevMapExtent?: Extent,
  mapExtent?: Extent
): boolean {
  return checkObjectsDifferent(prevMapExtent, mapExtent, [
    'xmin',
    'xmax',
    'ymin',
    'ymax',
  ]);
}

export function isZoomLevelChanged(
  prevZoomLevel: number | undefined,
  zoomLevel: number | undefined
): boolean {
  return (
    (prevZoomLevel === undefined && zoomLevel !== undefined) ||
    prevZoomLevel !== zoomLevel
  );
}

export function isDataVariableChanged(
  prevVariableInfo?: DataVariableInfo,
  variableInfo?: DataVariableInfo
): boolean {
  const dataVar = prevVariableInfo
    ? prevVariableInfo.dataVariables[prevVariableInfo.selectedVariable]
    : undefined;

  const currentDataVar = variableInfo
    ? variableInfo.dataVariables[variableInfo.selectedVariable]
    : undefined;
  return checkObjectsDifferent(dataVar, currentDataVar, ['ID']);
}

export function isIndustryChanged(
  { clusterName: prevClusterName, industries: prevIndustries }: AppState,
  { clusterName, industries }: AppState
): boolean {
  // Check clusterName
  if (
    (!prevClusterName && clusterName) ||
    (prevClusterName && !clusterName) ||
    (!prevClusterName && !clusterName && prevClusterName !== clusterName)
  )
    return true;

  const objectsInstantiated = checkObjectsInstantiated(
    industries,
    prevIndustries
  );
  if (objectsInstantiated) {
    return true;
  }
  if (industries && prevIndustries) {
    if (industries.length !== prevIndustries.length) {
      return true;
    }
    return industries.some((ind, index) =>
      checkObjectsDifferent(ind, prevIndustries[index], ['ID'])
    );
  }
  return industries !== prevIndustries;
}
