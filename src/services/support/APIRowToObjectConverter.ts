import { VarParts } from '../../typings/metadataModels';
import {
  MergeParameters,
  CensusAPIDataObject,
  FilterDataResultsParameters,
  CensusAPIHeaderRow,
  CensusAPIDataRow,
  FilterParameters,
} from './FetcherTypes';

export class APIRowToObjectConverter {
  public static apiRowToDataObject(
    params: MergeParameters
  ): CensusAPIDataObject[] {
    const {
      dataVarPartition,
      mergedResults,
      duplicates,
      selectColumns,
      includeGeoIds,
      includePlaces,
    } = params;
    let filteredResults: CensusAPIDataObject[] = [];

    if (
      dataVarPartition.raceGroups ||
      dataVarPartition.sexGroups ||
      dataVarPartition.vetGroups
    ) {
      // replace variable ids with aliases.
      const paramsColumnsToObject = {
        mergedResults,
        dataVarPartition,
      };
      filteredResults = APIRowToObjectConverter.raceSexVetColumnsToDataObject(
        paramsColumnsToObject
      );
    } else {
      // if multiple sectors is not applicable re-populate duplicated results
      if (duplicates && mergedResults.length > 0) {
        selectColumns.forEach((col, colIdx) => {
          // If the column in the header is not the same as expected - means this is a case of duplicate
          if (mergedResults[0][colIdx] !== col) {
            const orginalColIndex = mergedResults[0].indexOf(col);
            mergedResults.forEach((mRes, mResIdx) => {
              mergedResults[mResIdx].splice(
                colIdx,
                0,
                mergedResults[mResIdx][orginalColIndex]
              );
            });
          }
        });
      }

      const paramsColumnsToObject = {
        variableParts: dataVarPartition.variableParts,
        includeGeoIds,
        includePlaces,
        mergedResults,
      };
      filteredResults = APIRowToObjectConverter.apiColumnsToDataObject(
        paramsColumnsToObject
      );
    }
    return filteredResults;
  }

  private static findAliases(
    allVarParts: VarParts[],
    source: string
  ): string[] {
    const aliases: string[] = [];
    // Look through all variables to see if one or more of them are the same as the source
    allVarParts.forEach((part) => {
      if (part.statVariable.name === source) {
        aliases.push(part.statVariable.alias);
      }
      if (part.moeVariable?.name === source) {
        aliases.push(part.moeVariable.alias);
      }

      if (part.flagVariable?.name === source) {
        aliases.push(part.flagVariable.alias);
      }
    });
    // If none of the variables match, then this must be geoId/industry/sex/race/vet column
    if (aliases.length === 0) {
      aliases.push(source);
    }
    return aliases;
  }

  private static apiColumnsToDataObject(
    params: FilterDataResultsParameters
  ): CensusAPIDataObject[] {
    const { includePlaces, mergedResults } = params;
    const includeGeoIds = params.includeGeoIds || [];

    let columns: CensusAPIHeaderRow = [];
    let rows: CensusAPIDataRow[] = [];
    if (mergedResults.length > 0) {
      [columns, ...rows] = mergedResults;
    }

    const apiGeos: Record<string, string>[] = [];

    // mergedResults
    rows.forEach((apiGeo) => {
      const apiGeoObj = {};
      columns.forEach((column, idx) => {
        APIRowToObjectConverter.findAliases(
          params.variableParts,
          column
        ).forEach((alias) => {
          apiGeoObj[alias] = apiGeo[idx];
        });
      });
      apiGeos.push(apiGeoObj);
    });

    // includePlaces
    // For Places
    if (includePlaces === true) {
      const filteredGeos: Record<string, string>[] = [];
      apiGeos.forEach((apiGeo) => {
        if (
          includeGeoIds.indexOf(apiGeo.state + apiGeo['county subdivision']) !==
          -1
        ) {
          // Remove the county element
          apiGeo.place = apiGeo['county subdivision'];
          filteredGeos.push(apiGeo);
        }
      });
      return filteredGeos;
    }

    // For everything other than places
    return apiGeos;
  }

  private static findRaceSexVetColumnIndex(
    apiColumns: CensusAPIHeaderRow,
    apiGeo: CensusAPIDataRow,
    raceSexVetColumn: string,
    expecedValues: (number | string)[]
  ): number {
    let colIndex = -1;
    apiColumns.forEach((column, idx) => {
      if (column === raceSexVetColumn) {
        colIndex = idx;
      }
    });
    let index = -1;
    expecedValues.forEach((grp, i) => {
      if (
        typeof grp === 'number' &&
        grp === Number.parseInt(apiGeo[colIndex] as string, 10)
      ) {
        index = i;
      } else if (
        typeof grp === 'string' &&
        grp.indexOf(apiGeo[colIndex] as string) > 0
      ) {
        index = i;
      }
    });
    return index;
  }

  private static raceSexVetColumnsToDataObject(
    params: FilterParameters
  ): CensusAPIDataObject[] {
    const { mergedResults, dataVarPartition } = params;
    const filteredResults = [] as Record<string, string>[];

    let columns: CensusAPIHeaderRow = [];
    let rows: CensusAPIDataRow[] = [];
    if (mergedResults.length > 0) {
      [columns, ...rows] = mergedResults;
    }

    rows.forEach((apiGeo) => {
      const row = {};
      let index = -1;
      if (dataVarPartition.raceGroups) {
        index = APIRowToObjectConverter.findRaceSexVetColumnIndex(
          columns,
          apiGeo,
          'RACE_GROUP',
          dataVarPartition.raceGroups
        );
      } else if (dataVarPartition.sexGroups) {
        index = APIRowToObjectConverter.findRaceSexVetColumnIndex(
          columns,
          apiGeo,
          'SEX',
          dataVarPartition.sexGroups
        );
      } else if (dataVarPartition.vetGroups) {
        index = APIRowToObjectConverter.findRaceSexVetColumnIndex(
          columns,
          apiGeo,
          'VET_GROUP',
          dataVarPartition.vetGroups
        );
      }

      const varID = dataVarPartition.variableParts[index].statVariable.name;
      const varIdAlias =
        dataVarPartition.variableParts[index].statVariable.alias;
      const variableFlag =
        dataVarPartition.variableParts[index].flagVariable !== undefined
          ? dataVarPartition.variableParts[index].flagVariable!.name
          : undefined;
      const varFlagAlias =
        dataVarPartition.variableParts[index].flagVariable !== undefined
          ? dataVarPartition.variableParts[index].flagVariable!.alias
          : undefined;

      columns.forEach((column, idx) => {
        if (column === varID) {
          row[varIdAlias] = apiGeo[idx];
        } else if (variableFlag !== undefined && column === variableFlag) {
          row[varFlagAlias!] = apiGeo[idx];
        } else {
          row[column] = apiGeo[idx];
        }
      });
      filteredResults.push(row);
    });
    return filteredResults;
  }
}
