export default [
  {
    row: 1,
    ID: 'customers',
    Name: 'Customers',
    PopUpTip:
      'Includes annual information on the Demographic, Economic, and Housing Characteristics of potential customers of my business from the 2015-2019 American Community Survey 5-Year Estimates. (These variables are NOT related to the Industry selected.)',
  },
  {
    row: 3,
    ID: 'businesses',
    Name: 'Businesses (Annual)',
    PopUpTip:
      'Includes annual information on businesses and international trade from the 2019 County Business Patterns program, the 2018 Nonemployer Statistics program, the 2019 International Trade in Goods and Services report, the 2017 Economic Census, and the 2017 Census of Agriculture. (These variables are related to the Industry selected.)',
  },
  {
    row: 5,
    ID: 'qbusinesses',
    Name: 'Businesses (Quarterly)',
    PopUpTip:
      "Includes quarterly information on the number of establishments, employment and wages from the Bureau of Labor Statistics' 2021 Quarterly Census of Employment and Wages. (These variables are related to the Industry selected.)",
  },
  {
    row: 7,
    ID: 'workforce',
    Name: 'Workforce',
    PopUpTip:
      'Includes quarterly labor force information at the 2- thru 4-digit NAICS levels from the 2020 Quarterly Workforce Indicators dataset. The measures shown on the map are for Quarter 4 and the Industry selected.',
    UserMsg:
      'These data are only available at the sector thru industry group (2- thru 4-digit NAICS) levels',
  },
  {
    row: 8,
    ID: 'permits',
    Name: 'Building Permits',
    PopUpTip:
      'Includes annual information on the number of (and the value of) the new residential building permits issued from the 2020 Building Permits Survey. (These variables are NOT related to the Industry selected.)',
  },
  {
    row: 9,
    ID: 'consumers',
    Name: 'Consumer Spending',
    PopUpTip:
      'Includes annual information on Consumer Expenditures per household in 2021 from Esri. (These variables are NOT related to the Industry selected.)',
  },
  {
    row: 10,
    ID: 'demographic',
    Name: 'Demographic Characteristics',
    PopUpTip:
      'Includes annual information on total population and population by age, race, and ethnicity from the 2015-2019 American Community Survey 5-Year Estimates',
    ParentID: 'customers',
    UserMsg:
      "These data are subject to sampling and non-sampling errors.  See <a href='http://www.census.gov/programs-surveys/acs/methodology.html' target='_blank'>Methodology</a> on the ACS Home Page for more information.",
  },
  {
    row: 11,
    ID: 'econ',
    Name: 'Socioeconomic Characteristics',
    PopUpTip:
      'Includes annual socioeconomic information, including household income, educational attainment, poverty, and employment from the 2015-2019 American Community Survey 5-Year Estimates',
    ParentID: 'customers',
    UserMsg:
      "These data are subject to sampling and non-sampling errors.  See <a href='http://www.census.gov/programs-surveys/acs/methodology.html' target='_blank'>Methodology</a> on the ACS Home Page for more information.",
  },
  {
    row: 12,
    ID: 'housing',
    Name: 'Housing Characteristics',
    PopUpTip:
      'Includes annual housing information, including the number of housing units, house value, and housing costs from the 2015-2019 American Community Survey 5-Year Estimates',
    ParentID: 'customers',
    UserMsg:
      "These data are subject to sampling and non-sampling errors.  See <a href='http://www.census.gov/programs-surveys/acs/methodology.html' target='_blank'>Methodology</a> on the ACS Home Page for more information.",
  },
  {
    row: 13,
    ID: 'employers',
    Name: 'Employers',
    PopUpTip:
      'Includes key annual statistics for businesses with 1 or more paid employees (Employers) from the 2019 County Business Patterns, 2017 Economic Census, and the 2017 Census of Agriculture',
    ParentID: 'businesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies or because the data have not been released yet.',
  },
  {
    row: 15,
    ID: 'nonemployers',
    Name: 'Nonemployers',
    PopUpTip:
      'Includes key annual statistics for businesses with no paid employees, such as independent contractors and sole proprietors (Nonemployers) from the 2018 Nonemployer Statistics and the 2017 Economic Census.',
    ParentID: 'businesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies.',
  },
  {
    row: 17,
    ID: 'ratios',
    Name: 'Key Ratios',
    PopUpTip:
      'Includes key annual ratios of business and demographic information, including employment per business, payroll per employee, population per business, and revenue per business from the 2019 County Business Patterns and Nonemployer Statistics, the 2017 Economic Census, and the 2013-2017 American Community Survey 5-Year Estimates.',
    ParentID: 'businesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies or because the data have not been released yet.',
  },
  {
    row: 18,
    ID: 'trade',
    Name: 'International Trade',
    PopUpTip:
      'Includes key annual statistics on imports and exports (totals and by mode of transportation) by state from the "U.S. International Trade in Goods and Services: Annual Revision for 2020" report. (Available for selected three- and four-digit agriculture, mining, and manufacturing NAICS-based products only.)',
    ParentID: 'businesses',
    UserMsg:
      "These data are also available for individual countries.  See <a href='https://usatrade.census.gov/' target='_blank'>USA Trade Online</a>  for more information.",
  },
  {
    row: 19,
    ID: 'levels',
    Name: 'Levels',
    PopUpTip:
      "Includes quarterly level information from the Bureau of Labor Statistics' 2020 Quarterly Census of Employment and Wages.",
    ParentID: 'qbusinesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies.',
  },
  {
    row: 20,
    ID: 'lchange',
    Name: 'Level Change',
    PopUpTip:
      "Includes quarterly level change information from the Bureau of Labor Statistics' 2020 Quarterly Census of Employment and Wages.",
    ParentID: 'qbusinesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies.',
  },
  {
    row: 21,
    ID: 'pchange',
    Name: 'Percent Change',
    PopUpTip:
      "Includes quarterly percent change information from the Bureau of Labor Statistics' 2020 Quarterly Census of Employment and Wages.",
    ParentID: 'qbusinesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies.',
  },
  {
    row: 22,
    ID: 'lq',
    Name: 'Location Quotient',
    PopUpTip:
      "Includes quarterly location quotient information from the Bureau of Labor Statistics' 2020 Quarterly Census of Employment and Wages.",
    ParentID: 'qbusinesses',
    UserMsg:
      'Information may not be available for all industries and areas to protect the privacy of individual companies.',
  },
  {
    row: 23,
    ID: 'user',
    Name: 'My Variables',
    PopUpTip:
      "Includes the user's own data variables that were uploaded to CBB using the Upload Data feature",
    UserMsg:
      'Information are only separately viewable in the map; these data are not shown in the reports',
  },
];
