import { DataPartitionParameters, DataVariablePartition } from './serviceTypes';

import {
  APIVariable,
  CensusAPIVariable,
  ProgramSource,
} from '../../typings/metadataModels';
import { MetadataService } from '../metadataService';

type DataVariablePartitionCreationParams = {
  apiUrl: string;
  dataSource: ProgramSource;
  geoFormat?: string;
  sectorField?: string;
};

function insertPartitionVarId(
  dataVarPartition: DataVariablePartition,
  apiVariable: APIVariable
): void {
  dataVarPartition.mapTigerIds.push(apiVariable.mapTigerId);
  dataVarPartition.mapStateIds.push(apiVariable.mapStateId);

  dataVarPartition.variableParts.push(apiVariable.variableParts);

  if (apiVariable.raceGroup !== undefined) {
    if (dataVarPartition.raceGroups === undefined) {
      dataVarPartition.raceGroups = [];
    }
    dataVarPartition.raceGroups.push(Number(apiVariable.raceGroup));
  }

  if (apiVariable.sexGroup !== undefined) {
    if (dataVarPartition.sexGroups === undefined) {
      dataVarPartition.sexGroups = [];
    }
    dataVarPartition.sexGroups.push(apiVariable.sexGroup);
  }

  if (apiVariable.vetGroup !== undefined) {
    if (dataVarPartition.vetGroups === undefined) {
      dataVarPartition.vetGroups = [];
    }
    dataVarPartition.vetGroups.push(apiVariable.vetGroup);
  }
}

function createDataVariablePartition(
  partitionCreationParams: DataVariablePartitionCreationParams
): DataVariablePartition {
  const { apiUrl, dataSource, geoFormat, sectorField } =
    partitionCreationParams;

  const dataVariablePartition: DataVariablePartition = {
    apiUrl,
    mapTigerIds: [],
    mapStateIds: [],
    dataSource,
    geoFormat,

    variableParts: [],
  };

  if (sectorField !== undefined) {
    dataVariablePartition.paramInd = sectorField;
  }
  return dataVariablePartition;
}

function appendParamToKey(
  urlKey: string,
  paramKey?: string,
  staticKey?: string
): string {
  let updatedKey = urlKey;
  if (paramKey !== undefined) {
    updatedKey += staticKey !== undefined ? staticKey : paramKey;
  }
  return updatedKey;
}

function getPartitionKey(source: APIVariable): string {
  let urlKey = source.apiUrl;
  // Add in static keys
  urlKey = appendParamToKey(urlKey, source.raceGroup, 'raceGroup');
  urlKey = appendParamToKey(urlKey, source.sexGroup, 'sexGroup');
  urlKey = appendParamToKey(urlKey, source.vetGroup, 'vetGroup');

  // Add in actual values for URLParameters and sector field
  urlKey = appendParamToKey(urlKey, source.urlParameters);
  urlKey = appendParamToKey(urlKey, source.sectorField);
  return urlKey;
}

export function getDataPartitionsByEndPts(params: DataPartitionParameters): {
  [partitionKey: string]: DataVariablePartition;
} {
  const { dataVariableList, geoTypeId, vintage } = params;

  // Verify that the specified vintage is available for all of the data variables
  if (
    !dataVariableList.every((dataVariable) =>
      MetadataService.isVintageAvailableForVariable(
        dataVariable.ID,
        geoTypeId,
        vintage
      )
    )
  ) {
    return {};
  }

  const apiVariables = dataVariableList.reduce((agg, apiVariable) => {
    const geoTypeVintage = MetadataService.getVintageForVariable(
      apiVariable.ID,
      geoTypeId,
      vintage
    );

    // Filter out only the Data API and User Defined data sources
    const op1Sources = geoTypeVintage.operand1.sources;
    const op2Sources = geoTypeVintage.operand2
      ? geoTypeVintage.operand2.sources
      : [];

    // Combine the values of each operand together in order to retrieve all of the necessary data in as few queries as possible.
    return [...agg, ...op1Sources, ...op2Sources];
  }, [] as APIVariable[]);

  // Create a map of all key to all partitions
  const dataVarPartitionsMap = apiVariables.reduce((agg, apiVariable) => {
    const urlKey = getPartitionKey(apiVariable);
    if (agg[urlKey] === undefined) {
      const dataSource = apiVariable.source;

      agg[urlKey] = createDataVariablePartition({
        apiUrl: `${apiVariable.apiUrl}${
          apiVariable.urlParameters === undefined
            ? ''
            : apiVariable.urlParameters
        }`,
        dataSource,
        geoFormat:
          dataSource === 'CENSUS_DATA_API'
            ? (apiVariable as CensusAPIVariable).geoFormat
            : undefined,
        sectorField: apiVariable.sectorField,
      });
    }
    return agg;
  }, {} as Record<string, DataVariablePartition>);

  // Now fit each source to the partition it belong to
  apiVariables.forEach((apiVariable) => {
    const urlKey = getPartitionKey(apiVariable);
    insertPartitionVarId(dataVarPartitionsMap[urlKey], apiVariable);
  });
  return dataVarPartitionsMap;
}
