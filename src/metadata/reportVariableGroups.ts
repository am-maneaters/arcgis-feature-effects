export default [
  {
    row: 1,
    ID: 'r12_demographic',
    name: 'Demographic Characteristics',
    GroupType: 'BriefingPane',
    ReportSection: 'r12_customers',
    GroupHeader:
      'Includes information on total population and population by age, race, and ethnicity from the 2010-2014 and the 2015-2019 American Community Survey 5-Year Estimates',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Estimate',
    ValueWithMoEColumnHeader: 'Estimate (MoE +/-)',
    GroupFooter:
      '<span>These data are subject to sampling and non-sampling errors.  See <a target="_NEW" href=\'https://www.census.gov/programs-surveys/acs/methodology.html\'>Methodology</a> on the ACS Home Page for more information.</span>',
  },
  {
    row: 2,
    ID: 'r12_econ',
    name: 'Socioeconomic Characteristics',
    GroupType: 'BriefingPane',
    ReportSection: 'r12_customers',
    GroupHeader:
      'Includes information on social and economic characteristics from the 2010-2014 and the 2015-2019 American Community Survey 5-Year Estimates',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Estimate',
    ValueWithMoEColumnHeader: 'Estimate (MoE +/-)',
    GroupFooter:
      '<span>These data are subject to sampling and non-sampling errors.  See <a target="_NEW" href=\'https://www.census.gov/programs-surveys/acs/methodology.html\'>Methodology</a> on the ACS Home Page for more information.</span>',
  },
  {
    row: 3,
    ID: 'r12_housing',
    name: 'Housing Characteristics',
    GroupType: 'BriefingPane',
    ReportSection: 'r12_customers',
    GroupHeader:
      'Includes information on housing characteristics from the 2010-2014 and the 2015-2019 American Community Survey 5-Year Estimates',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Estimate',
    ValueWithMoEColumnHeader: 'Estimate (MoE +/-)',
    GroupFooter:
      '<span>These data are subject to sampling and non-sampling errors.  See <a target="_NEW" href=\'https://www.census.gov/programs-surveys/acs/methodology.html\'>Methodology</a> on the ACS Home Page for more information.</span>',
  },
  {
    row: 4,
    ID: 'r12_employers',
    name: 'Employer Businesses',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes key statistics for businesses with 1 or more paid employees (Employers) from the 2015 thru 2019 County Business Patterns, 2012 and 2017 Economic Census, and the 2017 Census of Agriculture.  (These variables are related to the Industry selected.)',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>Information may not be available for all industries and areas to protect the privacy of individual companies.</span><br><span>Source: <a target="_NEW" href="https://www.census.gov/programs-surveys/cbp/about.html">2019 County Business Patterns</a> or <a target="_NEW" href="https://www.census.gov/programs-surveys/economic-census.html">2017 Economic Census</a></span>',
  },
  {
    row: 5,
    ID: 'r12_revenue',
    name: 'Business Revenue',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes key statistics on business revenue for businesses with 1 or more paid employees (Employers) from the 2012 and 2017 Economic Census.  (These variables are related to the Industry selected.)',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>Information may not be available for all industries and areas to protect the privacy of individual companies.</span><br><span>Source: <a target="_NEW" href="https://www.census.gov/programs-surveys/economic-census.html">2017 Economic Census</a></span>',
  },
  {
    row: 6,
    ID: 'r12_nonemployers',
    name: 'Nonemployer Businesses',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes key statistics for businesses with no paid employees (such as independent contractors and sole proprietors (Nonemployers)) from the 2014 thru 2018 Nonemployer Statistics programs and the 2012 and 2017 Economic Census.  (These variables are related to the Industry selected.)',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>Information may not be available for all industries and areas to protect the privacy of individual companies.</span><br><span>Source: <a target="_NEW" href="https://www.census.gov/programs-surveys/nonemployer-statistics.html">2018 Nonemployer Statistics</a></span>',
  },
  {
    row: 7,
    ID: 'r12_trade',
    name: 'U.S. International Trade in Goods',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes key statistics on imports and exports (totals and by mode) for 3- and 4-digit NAICS-based categories* by state and by import continent of origination or export continent of destination from the "U.S. International Trade in Goods and Services: Annual Revision for 2019" report. State data are based on the Origin of Movement (Exports) and State of Destination (Imports) data series. International Trade Values are based on a monthly compilation of actual reported data as recorded by the U.S. Government and are not considered estimates.',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>*U.S. international trade data are collected using the Harmonized Tariff Schedule (imports) and Schedule B (exports) which are based on the commodity type while NAICS are based on supply or industry type. Users should be aware of these differences when comparing these data with other NAICS datasets.</span><br><span>*For help with these data, including more information on these NAICS-based categories, see <a target="_NEW" href="https://www.census.gov/foreign-trade/guide/sec2.html">Guide to Foreign Trade Statistics</a></span><br><span>Source: <a target="_NEW" href="https://www.census.gov/foreign-trade/index.html">International Trade Statistics</a>, Economic Indicators Divisions. For up-to-date and historical statistics, visit <a target="_NEW" href="https://usatrade.census.gov/">USA Trade Online</a></span>',
  },
  {
    row: 8,
    ID: 'r12_workforce',
    name: 'Workforce',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes quarterly labor force information from the 2021 Quarterly Workforce Indicators dataset. The measures shown on the map and report table are for Quarter 4 and the Industry selected.',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>For the latest quarterly data as well as data broken out by the gender, age, and educational attainment of the worker, go to <a target="_NEW" href=\'https://qwiexplorer.ces.census.gov/\'>QWI Explorer</a>.</span><br><span>Source: <a target="_NEW" href="https://lehd.ces.census.gov/data/#qwi\r\n">Longitudinal-Employer Household Dynamics Program (LEHD)</a></span>',
  },
  {
    row: 13,
    ID: 'r12_qbusinesses',
    name: 'Quarterly Businesses',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes business information from the BLS Quarterly Census of Employment and Wages for the selected industry and geography. The information provides insight into the number of establishments, employment, and wages on a quarterly basis.',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>For more employment and wage data, including information on NAICS-based categories, visit <a target="_NEW" href=\'https://www.bls.gov/cew/\'>QCEW homepage</a>.</span>\r\n<br><span>See methodology in the Handbook of Methods on the <a target="_NEW" href=\'https://www.bls.gov/opub/hom/cew/design.htm\'>QCEW homepage</a>.</span>\r\n<br><span> Information may not be shown for all industries and areas to protect the privacy of individual companies.  For more information, see <a target="_NEW" href=\'https://www.bls.gov/bls/confidentiality.htm\'>Confidentiality</a>.</span>\r\n<br><span> For FAQs see <a target="_NEW" href=\'https://www.bls.gov/cew/questions-and-answers.htm\'>here</a>.</span>\r\n<br><span>Source: <a target="_NEW" href=\'https://www.bls.gov/cew/\'>Quarterly Census of Employment and Wages</a>.</span>',
  },
  {
    row: 14,
    ID: 'r12_permits',
    name: 'Building Permits',
    GroupType: 'BusinessSummary',
    ReportSection: 'r12_businesses',
    GroupHeader:
      'Includes information on new residential building permits issued during 2020 from the Building Permits Survey. (These variables are NOT related to the Industry selected.)',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
    GroupFooter:
      '<span>Source: <a target="_NEW" href="https://www.census.gov/construction/bps/">Building Permits Survey</a></span>',
  },
  {
    row: 15,
    ID: 'r12_consumers',
    name: 'Consumer Spending',
    GroupType: 'DataList',
    ReportSection: 'r12_consumers',
    GroupHeader:
      'Includes information on consumer expenditures per household in 2021 from Esri',
    NameColumnHeader: 'Name',
    ValueColumnHeader: 'Value',
    ValueWithMoEColumnHeader: 'Value (MoE)',
  },
];
