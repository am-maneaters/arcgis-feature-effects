export default [
  {
    row: 1,
    ID: 'title',
    name: 'Contents',
    SectionType: 'TitlePage',
    ReportTypes: ['summary', 'detailed'],
    PopUpTip: 'Includes information on the contents of this report',
  },
  {
    row: 2,
    ID: 'r12_customers',
    name: 'My Potential Customers',
    SectionType: 'ContentPage',
    ReportTypes: ['summary', 'detailed'],
    PopUpTip:
      'Includes information on the Demographic, Economic, and Housing Characteristics of potential customers of my business from the 2015-2019 and the 2010-2014 American Community Survey 5-Year Estimates',
    footer:
      '<span>Source: <a target="_NEW" href="https://www.census.gov/programs-surveys/acs/news/data-releases/2019/release.html">2015-2019 American Community Survey 5-year Estimates</a></span>',
  },
  {
    row: 4,
    ID: 'r12_businesses',
    name: 'Business Summary',
    SectionType: 'BusinessSummary',
    ReportTypes: ['summary', 'detailed'],
    PopUpTip:
      'Includes information on employer and nonemployer businesses (as well as key operating ratios) from the 2019 County Business Patterns, 2018 Nonemployer Statistics, 2017 Economic Census, and the 2017 Census of Agriculture (These variables are related to the Industry selected.)',
  },
  {
    row: 7,
    ID: 'r12_consumers',
    name: 'Consumer Spending',
    SectionType: 'ContentPage',
    ReportTypes: ['summary', 'detailed'],
    PopUpTip:
      'Includes information on Consumer Expenditures per Household in 2021 from Esri',
    footer:
      '<span>Source: <a target="_NEW" href="http://doc.arcgis.com/en/esri-demographics/data/consumer-spending.htm">Esri (2021)</a></span>',
  },
  {
    row: 8,
    ID: 'footer',
    name: 'About Data',
    SectionType: 'Footer',
    ReportTypes: ['summary', 'detailed'],
    PopUpTip:
      'Includes information on Methodology, Explanation of Codes and other helpful links',
  },
];
