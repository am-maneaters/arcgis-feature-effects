import { clone } from 'lodash-es';
import { APIService } from '../apiService';
import {
  ApiRecord,
  GeographyTypeToApiRecordListMap,
} from '../support/serviceTypes';
import * as ServiceUtils from '../support/serviceUtils';
import {
  NO_INDUSTRY_ID,
  DataRecord,
  DetailedGeo,
  GeographyPartitionsMap,
  TabularParameters,
} from '../../typings/appModels';
import {
  APIVariable,
  DataVariableGeoTypeVintage,
  DataVariableProcessor,
  GeoType,
} from '../../typings/metadataModels';
import { MetadataService } from '../metadataService';
import * as Nambers from '../../util/namber';
import { Namber } from '../../util/namber';

export type DataVariableValues = {
  op1Values: Namber[];
  op1Moes: Namber[];
  op1Terms: Namber[][];
  op2Values: Namber[];
  op2Moes: Namber[];
  op2Terms: Namber[][];
};

export type OperandValues = {
  statValues: Namber[];
  moeValues: Namber[];
  opTerms: Namber[];
};

export type SummarizedFinalParams = DataVariableValues & {
  processor: DataVariableProcessor;
  moeNA: boolean;
};

export abstract class BaseTabulator {
  constructor(readonly apiService: APIService) {}

  protected async getApiData(
    params: TabularParameters
  ): Promise<GeographyTypeToApiRecordListMap> {
    return BaseTabulator.mapToApiRecords(
      params.geographiesMap,
      await this.apiService.createAPIQueries(params)
    );
  }

  protected static createEmptyDataVariableValues(): DataVariableValues {
    return {
      op1Values: [],
      op1Moes: [],
      op1Terms: [],
      op2Values: [],
      op2Moes: [],
      op2Terms: [],
    };
  }

  protected static combineDataValues(
    aggDataValues: DataVariableValues,
    additionalDataValues: DataVariableValues
  ): DataVariableValues {
    return {
      op1Values: [
        ...aggDataValues.op1Values,
        ...additionalDataValues.op1Values,
      ],
      op1Moes: [...aggDataValues.op1Moes, ...additionalDataValues.op1Moes],
      op1Terms: [...aggDataValues.op1Terms, ...additionalDataValues.op1Terms],

      op2Values: [
        ...aggDataValues.op2Values,
        ...additionalDataValues.op2Values,
      ],
      op2Moes: [...aggDataValues.op2Moes, ...additionalDataValues.op2Moes],
      op2Terms: [...aggDataValues.op2Terms, ...additionalDataValues.op2Terms],
    };
  }

  protected static collectValues(
    apiRecords: ApiRecord[],
    dataVariableVintage: DataVariableGeoTypeVintage,
    selectedIndustryIds: string[],
    moeNA: boolean
  ): DataVariableValues {
    return apiRecords.reduce((dataVarValues, apiRecord) => {
      const operands1 = BaseTabulator.collectOperandValues(
        apiRecord,
        dataVariableVintage.operand1.sources,
        selectedIndustryIds,
        moeNA
      );

      dataVarValues.op1Values = [
        ...dataVarValues.op1Values,
        ...operands1.statValues,
      ];
      dataVarValues.op1Moes = [
        ...dataVarValues.op1Moes,
        ...operands1.moeValues,
      ];
      dataVarValues.op1Terms.push(operands1.opTerms);
      if (dataVariableVintage.operand2) {
        const operands2 = BaseTabulator.collectOperandValues(
          apiRecord,
          dataVariableVintage.operand2.sources,
          selectedIndustryIds,
          moeNA
        );
        dataVarValues.op2Values = [
          ...dataVarValues.op2Values,
          ...operands2.statValues,
        ];
        dataVarValues.op2Moes = [
          ...dataVarValues.op2Moes,
          ...operands2.moeValues,
        ];
        dataVarValues.op2Terms.push(operands2.opTerms);
      }
      return dataVarValues;
    }, BaseTabulator.createEmptyDataVariableValues());
  }

  protected static calculateStatAndMoe(
    params: SummarizedFinalParams
  ): DataRecord {
    const dataResult: DataRecord = {
      stat: BaseTabulator.getSummFinalValue(params),
    };
    if (params.moeNA === false) {
      dataResult.moe = BaseTabulator.getSummFinalMoe(params);
    }
    return dataResult;
  }

  // Functions related to calculation of stats
  private static getSummFinalValue(params: SummarizedFinalParams): Namber {
    const { processor } = params;
    let summarizedValue: Namber = Namber(`Unknown processor ${processor}`);
    switch (processor) {
      case 'IDENTITY': {
        summarizedValue = BaseTabulator.getSummFinalIdentityValue(params);
        break;
      }
      case 'SUM': {
        summarizedValue = BaseTabulator.getSummFinalSumValue(
          params.op1Values,
          params.op2Values
        );
        break;
      }
      case 'PERCENT': {
        summarizedValue = BaseTabulator.getSummPercentRatioValue(
          'PERCENT',
          params.op1Terms,
          params.processor,
          params.op1Values,
          params.op2Values
        );
        break;
      }
      case 'RATIO': {
        summarizedValue = BaseTabulator.getSummPercentRatioValue(
          'RATIO',
          params.op1Terms,
          params.processor,
          params.op1Values,
          params.op2Values
        );
        break;
      }
      default: {
        // Do nothing
      }
    }
    return summarizedValue;
  }

  private static getSummFinalIdentityValue(
    params: SummarizedFinalParams
  ): Namber {
    // Need to look at specific error code in the moe, only return n/a if the error code is '**', '***', or 'null' value.
    // We check this by looking through the message for the specific code.
    if (
      params.moeNA === false &&
      params.op1Values.length === 1 &&
      params.op1Moes.length === 1 &&
      Nambers.isNA(params.op1Moes[0]) &&
      (params.op1Moes[0].message === '**' ||
        params.op1Moes[0].message === '***' ||
        params.op1Moes[0].message === '')
    ) {
      return Namber('n/a');
    }
    return BaseTabulator.calculateDataValue(params.op1Values);
  }

  private static getSummFinalSumValue(
    op1Array: Namber[],
    op2Array: Namber[]
  ): Namber {
    return BaseTabulator.calculateDataValue([...op1Array, ...op2Array]);
  }

  private static getSummPercentRatioValue(
    processor: DataVariableProcessor,
    op1Terms: Namber[][],
    op1Processor: DataVariableProcessor,
    op1Array: Namber[],
    op2Array: Namber[]
  ): Namber {
    BaseTabulator.updateSummDenominatorArray(op1Terms, op1Processor, op2Array);
    const val1 = BaseTabulator.calculateDataValue(op1Array);
    const updatedOp2Array = op2Array === undefined ? [] : op2Array;
    const val2 = BaseTabulator.calculateDataValue(updatedOp2Array);
    if (val1.value === 0) {
      return Namber(0);
    }
    if (val2.value === 0) {
      return Namber('n/a');
    }
    if (processor === 'PERCENT') {
      return Nambers.div(Nambers.mul(val1, 100), val2);
    }
    if (processor === 'RATIO') {
      return Nambers.div(val1, val2);
    }
    return Namber('n/a');
  }

  // Functions related to calculation of stats
  private static getSummFinalMoe(params: SummarizedFinalParams): Namber {
    const { processor } = params;
    let summarizedMoE: Namber = Namber(`Unknown processor ${processor}`);
    switch (processor) {
      case 'IDENTITY': {
        summarizedMoE = BaseTabulator.calculateMOEForSum(
          params.op1Values,
          params.op1Moes
        );
        break;
      }
      case 'SUM': {
        summarizedMoE = BaseTabulator.calculateMOEForSum(
          [...params.op1Values, ...params.op2Values],
          [...params.op1Moes, ...params.op2Moes]
        );
        break;
      }
      case 'PERCENT': {
        summarizedMoE = BaseTabulator.calculateMOEForPercent(
          params.op1Values,
          params.op1Moes,
          params.op2Values,
          params.op2Moes
        );
        break;
      }
      case 'RATIO': {
        summarizedMoE = BaseTabulator.calculateMOEForRatio(
          params.op1Values,
          params.op1Moes,
          params.op2Values,
          params.op2Moes
        );
        break;
      }
      default: {
        // Do nothing
      }
    }
    return summarizedMoE;
  }

  private static calculateMOEForSum(
    estimates: Namber[],
    estimatesMOE: Namber[]
  ): Namber {
    // If there is only one element then this is a case of Identity.
    // In this case, Use the MoE of the first element as is.
    if (estimates.length === 1 && estimatesMOE.length === 1) {
      return estimatesMOE[0];
    }
    // If every value is Not Applicable, return a condensed result
    if (estimates.every(Nambers.isNA) && estimatesMOE.every(Nambers.isNA)) {
      return Namber('No valid values present in estimates and estimatesMOE');
    }

    // At least one valid value is present in both arrays, calculate as well as possible. The
    // not-applicable values are explicitly treated as zeros. This is where we have the opportunity
    // to plug in specialized methods for handling missing values on a per-program basis
    const est = estimates.map((e) => (Nambers.hasValue(e) ? e.value : 0));
    const estMoe = estimatesMOE.map((e) => (Nambers.hasValue(e) ? e.value : 0));

    // Calculate the sum-of-squares of the MOE values *only* when the estimate is non-zero
    const sumOfSquareVals = estMoe
      .map((moe, index) => (est[index] === 0 ? 0 : moe ** 2))
      .reduce((a, b) => a + b, 0);

    // Calculate the maximum of the MOE values only where the estimate is zero
    const maxZeroEstMOE = estMoe
      .map((moe, index) => (est[index] === 0 ? moe : 0))
      .reduce((a, b) => Math.max(a, b), 0);

    // Add the square of the maximum to the sum of squares and return the norm value
    return Namber(Math.sqrt(sumOfSquareVals + maxZeroEstMOE ** 2));
  }

  private static calculateMOEForPercent(
    numerators: Namber[],
    numeratorsMOE: Namber[],
    denominators: Namber[],
    denominatorsMOE: Namber[]
  ): Namber {
    const sumNum = numerators.reduce(Nambers.add, Nambers.ZERO);
    const sumDen = denominators.reduce(Nambers.add, Nambers.ZERO);

    const moeNum = BaseTabulator.calculateMOEForSum(numerators, numeratorsMOE);
    const moeDen = BaseTabulator.calculateMOEForSum(
      denominators,
      denominatorsMOE
    );

    if (Nambers.equal(sumNum, sumDen)) {
      return Nambers.mul(Nambers.div(moeNum, sumDen), 100);
    }

    // Calculate the left-hand-side (lhs) and right-hand-side (rhs) separately since these subexpressions
    // may be reused.
    const lhs = Nambers.pow(moeNum, 2);
    const rhs = Nambers.mul(
      Nambers.pow(Nambers.div(sumNum, sumDen), 2),
      Nambers.pow(moeDen, 2)
    );

    let radicand = Nambers.sub(lhs, rhs);
    if (Nambers.hasValue(radicand) && radicand.value <= 0) {
      radicand = Nambers.add(lhs, rhs);
    }

    return Nambers.mul(Nambers.div(Nambers.sqrt(radicand), sumDen), 100);
  }

  private static calculateMOEForRatio(
    numerators: Namber[],
    numeratorsMOE: Namber[],
    denominators: Namber[],
    denominatorsMOE: Namber[]
  ): Namber {
    const sumNum = numerators.reduce(Nambers.add, 0);
    const sumDen = denominators.reduce(Nambers.add, 0);

    // for ratio neither MOE(n) or MOE(d) is null, if either is null MOE is also null
    const moeNum = BaseTabulator.calculateMOEForSum(numerators, numeratorsMOE);
    const moeDen = BaseTabulator.calculateMOEForSum(
      denominators,
      denominatorsMOE
    );

    // The Namber function will catch division-by-zero and other issues, so just write
    // the code as if all values are valid and within range.
    // const radicand = (moeNum ** 2) + ((sumNum / sumDen) ** 2) * (moeDen ** 2);
    const radicand = Nambers.add(
      Nambers.pow(moeNum, 2),
      Nambers.mul(
        Nambers.pow(Nambers.div(sumNum, sumDen), 2),
        Nambers.pow(moeDen, 2)
      )
    );

    return Nambers.div(Nambers.sqrt(radicand), sumDen);
  }

  // Utility functions
  private static updateSummDenominatorArray(
    op1Array: Namber[][],
    processor: DataVariableProcessor,
    op2Array: Namber[]
  ): void {
    // if numerator is 0 or null update denominator.
    op1Array.forEach((termsArray, index) => {
      let val: Namber;
      if (termsArray.length > 1 && processor === 'SUM') {
        val = termsArray.reduce(Nambers.add, Namber(0));
      } else {
        val = termsArray[0];
      }
      if (val.value === 0 || val.value === 'n/a') {
        op2Array[index] = val;
      }
    });
  }

  private static calculateDataValue(valArray: Namber[]): Namber {
    return valArray.reduce((acc, val) => Nambers.add(acc, val), Namber(0));
  }

  private static collectOperandValues(
    apiRecord: ApiRecord,
    sources: APIVariable[],
    selectedIndustryIds: string[],
    moeNA: boolean
  ): OperandValues {
    const statValues: Namber[] = [];
    const moeValues: Namber[] = [];

    sources.forEach((source) => {
      const industryLikeIds = selectedIndustryIds
        .map((selectedIndustryId) =>
          source.sectorField !== undefined ? selectedIndustryId : NO_INDUSTRY_ID
        )
        .filter((item, index, arr) => arr.indexOf(item) === index);

      industryLikeIds.forEach((industryLikeId) => {
        const statVal = ServiceUtils.getApiData(
          industryLikeId,
          source.variableParts.statVariable.alias,
          apiRecord.data
        );
        statValues.push(statVal);
        if (moeNA === false) {
          const moeVal = ServiceUtils.getApiData(
            industryLikeId,

            source.variableParts.moeVariable!.alias,
            apiRecord.data
          );
          moeValues.push(moeVal);
        }
      });
    });
    return {
      statValues,
      moeValues,
      opTerms: clone(statValues),
    };
  }

  private static mapToApiRecords(
    geographiesMap: GeographyPartitionsMap,
    apiRecordsMap: GeographyTypeToApiRecordListMap
  ): GeographyTypeToApiRecordListMap {
    Object.keys(geographiesMap).forEach((geoTypeId) => {
      if (apiRecordsMap[geoTypeId] === undefined) {
        apiRecordsMap[geoTypeId] = [];
      }
      const geoType = MetadataService.getGeoType(geoTypeId);
      const apiGeos = apiRecordsMap[geoTypeId];
      const inputGeos = geographiesMap[geoTypeId].flat();
      inputGeos.forEach((inputGeo) => {
        BaseTabulator.createApiRecord(apiGeos, geoType, inputGeo);
      });
    });
    return apiRecordsMap;
  }

  private static createApiRecord(
    apiGeos: ApiRecord[],
    geoType: GeoType,
    inputGeo: DetailedGeo
  ): void {
    const apiGeo = apiGeos.find((value) => value.id === inputGeo.id);
    if (apiGeo === undefined) {
      apiGeos.push(ServiceUtils.buildApiRecord(geoType, inputGeo));
    }
  }
}
