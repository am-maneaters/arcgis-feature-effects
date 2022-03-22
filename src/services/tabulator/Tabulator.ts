import * as ServiceUtils from '../support/serviceUtils';
import {
  CLUSTER_INDUSTRY_ID,
  TabularParameters,
  TabularResult,
} from '../../typings/appModels';
import { DataVariableProcessor } from '../../typings/metadataModels';
import { MetadataService } from '../metadataService';
import { BaseTabulator } from './BaseTabulator';

export class Tabulator extends BaseTabulator {
  public async getTabularData(
    params: TabularParameters
  ): Promise<TabularResult> {
    const apiRecordsMap = await this.getApiData(params);

    const { dataVariableList, geographiesMap, industryIdList, vintage } =
      params;

    const tabularDataResult = Object.keys(geographiesMap).reduce(
      (agg, gTypeId) => {
        const geoRecordsForGeoType = apiRecordsMap[gTypeId].map((apiRecord) => {
          const geoType = MetadataService.getGeoType(gTypeId);
          const geoRecord = ServiceUtils.buildGeoRecordFromApiRecord(
            geoType,
            apiRecord
          );
          dataVariableList.forEach((dataVariable) => {
            const dataVariableVintage = MetadataService.getVintageForVariable(
              dataVariable.ID,
              gTypeId,
              vintage
            );
            const op1IdsAndAliases = ServiceUtils.getAPIVariableIdsAndAliases(
              dataVariableVintage.operand1.sources
            );
            const op2IdsAndAliases = ServiceUtils.getAPIVariableIdsAndAliases(
              dataVariableVintage.operand2 === undefined
                ? []
                : dataVariableVintage.operand2.sources
            );

            const processor: DataVariableProcessor =
              dataVariableVintage.Processor;
            const moeNA = ServiceUtils.isMoENA(
              op1IdsAndAliases,
              op2IdsAndAliases
            );

            // First calculate values for all industries individually
            industryIdList.forEach((selectedIndustryId) => {
              const geoDataValuesForIndustry = BaseTabulator.collectValues(
                [apiRecord],
                dataVariableVintage,
                [selectedIndustryId],
                moeNA
              );
              const geoResult = BaseTabulator.calculateStatAndMoe({
                ...geoDataValuesForIndustry,
                processor,
                moeNA,
              });

              ServiceUtils.setComputedData(
                MetadataService.getIndustryLikeIdForVGTV(
                  dataVariableVintage,
                  selectedIndustryId
                ),
                geoRecord.data,
                dataVariableVintage.variableId,
                ServiceUtils.scaleAndRound(
                  geoResult.stat,
                  dataVariableVintage.ScaleFactor,
                  dataVariableVintage.Round
                ),
                geoResult.moe !== undefined
                  ? ServiceUtils.scaleAndRound(
                      geoResult.moe,
                      dataVariableVintage.ScaleFactor,
                      dataVariableVintage.Round
                    )
                  : undefined
              );
            });

            // Then, calculate values for all industries (cluster)
            const geoDataValuesForIndustryCluster = BaseTabulator.collectValues(
              [apiRecord],
              dataVariableVintage,
              industryIdList,
              moeNA
            );
            const geoResultForCluster = BaseTabulator.calculateStatAndMoe({
              ...geoDataValuesForIndustryCluster,
              processor,
              moeNA,
            });
            ServiceUtils.setComputedData(
              CLUSTER_INDUSTRY_ID,
              geoRecord.data,
              dataVariableVintage.variableId,
              ServiceUtils.scaleAndRound(
                geoResultForCluster.stat,
                dataVariableVintage.ScaleFactor,
                dataVariableVintage.Round
              ),
              geoResultForCluster.moe !== undefined
                ? ServiceUtils.scaleAndRound(
                    geoResultForCluster.moe,
                    dataVariableVintage.ScaleFactor,
                    dataVariableVintage.Round
                  )
                : undefined
            );
          });
          return geoRecord;
        });

        agg[gTypeId] = geoRecordsForGeoType;
        return agg;
      },
      {} as TabularResult
    );
    return tabularDataResult;
  }
}
