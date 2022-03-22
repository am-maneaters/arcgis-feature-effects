import {
  CalciteAction,
  CalciteTab,
  CalciteTabNav,
  CalciteTabs,
  CalciteTabTitle,
} from '@esri/calcite-components-react';
import '@esri/calcite-components/dist/components/calcite-tab';
import '@esri/calcite-components/dist/components/calcite-tabs';
import '@esri/calcite-components/dist/components/calcite-tab-title';
import '@esri/calcite-components/dist/components/calcite-tab-nav';

import React from 'react';
import Paper from '../components/Paper';

type Props = {};

export default function DashboardView({}: Props) {
  return (
    <Paper>
      <div className="flex justify-evenly items-stretch gap-4 resize">
        <div className="gap-2 flex flex-col">
          <div className="text-lg font-bold text-center">
            Scott County, Minnesota
          </div>

          <div className="flex gap-2 flex-1">
            <div className="flex flex-1 px-2 py-1 bg-blue-200 rounded-sm items-center">
              <div className="border-2 w-9 text-center inline-block px-1 rounded-xl text-xs flex-shrink items-start mr-2">
                1st
              </div>
              <div>
                <div className="text-lg font-bold">145,275 (n/a)</div>
                <div>Total population (MoE +/-)</div>
              </div>
            </div>
            <div className="flex flex-1 px-2 py-1 bg-amber-600 text-white rounded-sm items-center">
              <div className="border-2 w-9 text-center inline-block px-1 rounded-xl text-xs flex-shrink items-start mr-2">
                2nd
              </div>
              <div>
                <div className="text-lg font-bold">50.2% (n/a)</div>
                <div>Percent female (MoE +/-)</div>
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-4 gap-1">
              {[
                ['2.90', 'Average household size (0.02)'],
                ['$102,152', 'Median household income ($3,021)'],
                ['94.7%', 'Percent high school degree or higher (2.0%)'],
                ['82.8%', 'Homeownership rate (1.0%)'],
              ].map(([val, label]) => (
                <div className="w-32 p-1 relative border-2 border-gray-500 text-center flex flex-col justify-center rounded-lg group">
                  <div className="text-xs">{label}</div>
                  <div className="text-lg font-bold">{val}</div>
                  <div className="hidden absolute inset-0 group-hover:flex backdrop-blur-lg bg-black/60 rounded-lg justify-center items-center">
                    <CalciteAction icon="pencil" scale="s" text="Edit" />
                    <CalciteAction icon="plus" scale="s" text="Promote" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-lg font-bold text-center">Total Population</div>
          <CalciteTabs layout="center" position="above" scale="m">
            <CalciteTabNav slot="tab-nav">
              <CalciteTabTitle>Geo Ranking</CalciteTabTitle>
              <CalciteTabTitle>Time Series</CalciteTabTitle>
              <CalciteTabTitle>Geo Compare</CalciteTabTitle>
            </CalciteTabNav>
            <CalciteTab>Geo Ranking</CalciteTab>
            <CalciteTab>Time Series</CalciteTab>
            <CalciteTab>Geo Comparison</CalciteTab>
          </CalciteTabs>
        </div>
      </div>
    </Paper>
  );
}
