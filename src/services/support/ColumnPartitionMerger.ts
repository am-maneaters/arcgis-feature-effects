import {
  CensusAPIDataResult,
  CensusAPIDataElement,
  CensusAPIHeaderRow,
  CensusAPIDataRow,
  CensusAPIParsedResult,
  CensusAPIResultColumnInfo,
  CensusAPIDataRowComponentsMap,
  CensusAPIDataRowComponents,
} from './FetcherTypes';

export class ColumnPartitionMerger {
  public static mergeColumnPartitions(
    results: CensusAPIDataResult[],
    colsUnique: string[]
  ): CensusAPIDataResult {
    // Map all partitions to the components maps
    const parsedResults = results.map((apiResult) =>
      ColumnPartitionMerger.rowsToComponents(apiResult, colsUnique)
    );

    // Collect all keys, associated id values & data column names
    const aggregation = {
      keyIdValuesMap: {},
      idColumnNames: [],
      dataColumnNames: [],
    } as {
      keyIdValuesMap: Record<string, CensusAPIDataElement[]>;
      idColumnNames: string[];
      dataColumnNames: string[];
    };
    parsedResults.reduce((agg, parsedResult) => {
      const { keyIdValuesMap, idColumnNames, dataColumnNames } = agg;
      Object.keys(parsedResult.rows).forEach((rowKey) => {
        keyIdValuesMap[rowKey] = parsedResult.rows[rowKey].idValues;
      });
      parsedResult.idColumnNames.forEach((columnName) => {
        ColumnPartitionMerger.insertUnique(idColumnNames, columnName);
      });
      parsedResult.dataColumnNames.forEach((columnName) => {
        ColumnPartitionMerger.insertUnique(dataColumnNames, columnName);
      });
      return agg;
    }, aggregation);

    // Create header row
    const headerRow: CensusAPIHeaderRow = [
      ...aggregation.dataColumnNames,
      ...aggregation.idColumnNames,
    ];

    // Now create data rows by looking up rows by their "artificial" key across all partitions
    const dataRows = Object.keys(aggregation.keyIdValuesMap).reduce(
      (agg, key) => {
        // First merge data values
        let valuesForKey: CensusAPIDataElement[] = [];
        parsedResults.forEach((parsedResult) => {
          const rowComponents = parsedResult.rows[key];
          if (rowComponents !== undefined) {
            valuesForKey = [...valuesForKey, ...rowComponents.dataValues];
          } else {
            // If there is a gap (no record for a certain key/column partition then just fill it with undefined's)
            const emptyValues = parsedResult.dataColumnNames.map(
              () => undefined
            );
            valuesForKey = [...valuesForKey, ...emptyValues];
          }
        });
        // And then tack on id values
        valuesForKey = [...valuesForKey, ...aggregation.keyIdValuesMap[key]];
        agg.push(valuesForKey);
        return agg;
      },
      [] as CensusAPIDataRow[]
    );

    return [headerRow, ...dataRows];
  }

  private static rowsToComponents(
    results: CensusAPIDataResult,
    dataColumns: string[]
  ): CensusAPIParsedResult {
    if (results.length > 0) {
      const resultsColumnInfo = results[0].reduce(
        (agg, column, colIndex) => {
          if (dataColumns.indexOf(column) === -1) {
            agg.idColumnIndexes.push(colIndex);
            agg.idColumnNames.push(column);
          } else {
            agg.dataColumnIndexes.push(colIndex);
            agg.dataColumnNames.push(column);
          }
          return agg;
        },
        {
          idColumnIndexes: [],
          idColumnNames: [],
          dataColumnIndexes: [],
          dataColumnNames: [],
        } as CensusAPIResultColumnInfo
      );
      const rows = results.reduce((agg, row, idx) => {
        if (idx !== 0) {
          const rowKey = ColumnPartitionMerger.getRowKey(
            resultsColumnInfo.idColumnIndexes,
            row as CensusAPIDataRow
          );

          agg[rowKey] = ColumnPartitionMerger.rowToComponents(
            resultsColumnInfo,
            row
          );
        }
        return agg;
      }, {} as CensusAPIDataRowComponentsMap);
      return {
        rows,
        idColumnNames: resultsColumnInfo.idColumnNames,
        dataColumnNames: resultsColumnInfo.dataColumnNames,
      };
    }
    return {
      rows: {},
      idColumnNames: [],
      dataColumnNames: [],
    };
  }

  private static rowToComponents(
    resultsColumnInfo: CensusAPIResultColumnInfo,
    row: CensusAPIDataRow
  ): CensusAPIDataRowComponents {
    const idValues = resultsColumnInfo.idColumnIndexes.reduce(
      (agg, colIndex) => {
        agg.push(row[colIndex]);
        return agg;
      },
      [] as CensusAPIDataElement[]
    );
    const dataValues = resultsColumnInfo.dataColumnIndexes.reduce(
      (agg, colIndex) => {
        agg.push(row[colIndex]);
        return agg;
      },
      [] as CensusAPIDataElement[]
    );
    return {
      idValues,
      dataValues,
    };
  }

  private static getRowKey(
    idColumnIndexes: number[],
    row: CensusAPIDataRow
  ): string {
    return idColumnIndexes.map((colIndex) => row[colIndex]).join('/');
  }

  private static insertUnique<T>(array: T[], elem: T): void {
    if (array.indexOf(elem) === -1) {
      array.push(elem);
    }
  }
}
