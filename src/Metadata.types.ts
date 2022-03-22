export type CategoryID =
  | 'customers'
  | 'demographic'
  | 'businesses'
  | 'trade'
  | 'employers'
  | 'nonemployers'
  | 'ratios'
  | 'econ'
  | 'housing'
  | 'workforce'
  | 'consumers';

export type DataVariable = {
  row: number;
  ID: string;
  Name: string;
  Display_Order: string;
  PopUpTip: string;
  ShowGeoChart: boolean;
  DisableMultiIndustryCluster: boolean;
  Round: number;
  UOM_Prefix?: string;
  UOM_Suffix?: string;
  Format_Number: boolean;
  ScaleFactor: number;
  Variable_Categories: ['customers', 'demographic'];
  Report_VariableGroups: ['r12_demographic'];
};
