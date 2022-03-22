import * as ServiceUtils from '../support/serviceUtils';
import {
  CLUSTER_INDUSTRY_ID,
  SummaryResult,
  TabularParameters,
} from '../../typings/appModels';
import {
  DataVariableGeoTypeVintage,
  DataVariableProcessor,
} from '../../typings/metadataModels';
import { MetadataService } from '../metadataService';
import { BaseTabulator, DataVariableValues } from './BaseTabulator';
import { Tabulator } from './Tabulator';

export class Summarizer extends Tabulator {
  public async getSummarizedData(
    params: TabularParameters
  ): Promise<SummaryResult> {
    const apiRecordsMap = await this.getApiData(params);

    const { dataVariableList, geographiesMap, industryIdList, vintage } =
      params;
    const summarizedData: SummaryResult = {};

    // Get data for all variables to find if MoE is available
    dataVariableList.forEach((dataVariable) => {
      const processors: DataVariableProcessor[] = [];

      // Is MoE Available
      let moeNA = false;
      let dataVariableVintage: DataVariableGeoTypeVintage;

      // Figure out a few values such as whether MoE is applicable, scale
      // factor, rounding info based on all geography types in the region
      Object.keys(geographiesMap).forEach((gTypeId, index) => {
        const gtDataVariableVintage = MetadataService.getVintageForVariable(
          dataVariable.ID,
          gTypeId,
          vintage
        );
        const op1IdsAndAliases = ServiceUtils.getAPIVariableIdsAndAliases(
          gtDataVariableVintage.operand1.sources
        );
        const op2IdsAndAliases = ServiceUtils.getAPIVariableIdsAndAliases(
          gtDataVariableVintage.operand2 === undefined
            ? []
            : gtDataVariableVintage.operand2.sources
        );
        processors.push(gtDataVariableVintage.Processor);
        // MoE's must be applicable for all types to be applicable for the region
        moeNA =
          moeNA ||
          ServiceUtils.isMoENA(op1IdsAndAliases, op2IdsAndAliases) === true;
        if (index === 0) {
          dataVariableVintage = gtDataVariableVintage;
        }
      });

      processors.filter((item, index, arr) => arr.indexOf(item) === index);

      // TODO If there are different types of Processors then we should halt and return an N/A
      if (processors.length > 1) {
        // Create N/A's here.
      }

      const processor: DataVariableProcessor = processors[0];

      // First calculate values for all industries individually
      industryIdList.forEach((selectedIndustryId) => {
        // collect values for all geo types
        const regionDataValuesForIndustry: DataVariableValues = Object.keys(
          apiRecordsMap
        ).reduce((dataVarValues, gTypeId) => {
          const dataValuesForGeoType = BaseTabulator.collectValues(
            apiRecordsMap[gTypeId],
            dataVariableVintage,
            [selectedIndustryId],
            moeNA
          );
          return BaseTabulator.combineDataValues(
            dataVarValues,
            dataValuesForGeoType
          );
        }, BaseTabulator.createEmptyDataVariableValues());

        const summarizedResult = BaseTabulator.calculateStatAndMoe({
          ...regionDataValuesForIndustry,
          processor,
          moeNA,
        });
        ServiceUtils.setComputedData(
          MetadataService.getIndustryLikeIdForVGTV(
            dataVariableVintage,
            selectedIndustryId
          ),
          summarizedData,
          dataVariable.ID,
          ServiceUtils.scaleAndRound(
            summarizedResult.stat,
            dataVariable.ScaleFactor,
            dataVariable.Round
          ),
          summarizedResult.moe !== undefined
            ? ServiceUtils.scaleAndRound(
                summarizedResult.moe,
                dataVariable.ScaleFactor,
                dataVariable.Round
              )
            : undefined
        );
      });

      // Then, calculate values for all industries (cluster)
      const regionDataValuesForIndustryCluster = Object.keys(
        apiRecordsMap
      ).reduce((dataVarValues, gTypeId) => {
        const dataValuesForGeoType = BaseTabulator.collectValues(
          apiRecordsMap[gTypeId],
          dataVariableVintage,
          industryIdList,
          moeNA
        );
        return BaseTabulator.combineDataValues(
          dataVarValues,
          dataValuesForGeoType
        );
      }, BaseTabulator.createEmptyDataVariableValues());
      const geoResultForCluster = BaseTabulator.calculateStatAndMoe({
        ...regionDataValuesForIndustryCluster,
        processor,
        moeNA,
      });
      ServiceUtils.setComputedData(
        CLUSTER_INDUSTRY_ID,

        summarizedData,
        dataVariable.ID,
        ServiceUtils.scaleAndRound(
          geoResultForCluster.stat,
          dataVariable.ScaleFactor,
          dataVariable.Round
        ),
        geoResultForCluster.moe !== undefined
          ? ServiceUtils.scaleAndRound(
              geoResultForCluster.moe,
              dataVariable.ScaleFactor,
              dataVariable.Round
            )
          : undefined
      );
    });
    return summarizedData;
  }
}
