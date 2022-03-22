import * as React from 'react';

import '@esri/calcite-components/dist/components/calcite-action';
import '@esri/calcite-components/dist/components/calcite-action-bar';
import '@esri/calcite-components/dist/components/calcite-radio-group';
import '@esri/calcite-components/dist/components/calcite-radio-group-item';
import '@esri/calcite-components/dist/components/calcite-shell';
import '@esri/calcite-components/dist/components/calcite-shell-panel';
import '@esri/calcite-components/dist/components/calcite-action-group';

import {
  CalciteAction,
  CalciteActionBar,
  CalciteShell,
} from '@esri/calcite-components-react';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import useMap from './hooks/layerHooks';
import MapViewComponent, { MapWidget } from './components/Map';
import { MapContext } from './components/Map/MapViewComponent';
import ControlBar from './components/ControlBar/ControlBar';
import DashboardView from './views/DashboardView';
import LegendView from './views/LegendView';
import GeoTypeSelect from './components/GeoTypeSelect/GeoTypeSelect';

interface Props {
  example?: string;
}

export default function App({ example }: Props) {
  const [clicked, setClicked] = React.useState(false);

  const { mapView, useLayer, useMapEvent, useWidget } = useMap(
    {
      basemap: 'gray-vector',
    },
    {
      extent: {
        spatialReference: { wkid: 102100 },
        xmax: -6576030,
        xmin: -15029354,
        ymax: 7498969,
        ymin: 1638389,
      },
    }
  );

  useLayer('stateLayer', {
    url: 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/USStates/FeatureServer/0',
  });

  useMapEvent('double-click', [], (event) => {
    event.stopPropagation();
  });
  useMapEvent('double-click', ['Control'], (event) => {
    event.stopPropagation();
  });

  useWidget(() => new ScaleBar(), { position: 'top-left' });

  return (
    <MapContext.Provider value={mapView}>
      <CalciteShell>
        {/*  Header Bar */}
        <h1 className="text-xl font-bold pl-4 pt-2" slot="header">
          Census Bureau Business Builder
        </h1>
        <ControlBar />
        <MapViewComponent view={mapView} key="mapview">
          <MapWidget position="bottom-right" key="legendview">
            <LegendView test={clicked} />
          </MapWidget>
          <MapWidget position="bottom-left" key="dashboardview">
            <DashboardView />
          </MapWidget>
          <MapWidget position="top-right" key="actionview">
            <CalciteActionBar
              className="pointer-events-auto"
              position="end"
              scale="s"
            >
              {[
                ['download', 'Download'],
                ['layers-reference', 'Reference Layers'],
                ['basemap', 'Basemap'],
                ['transparency', 'Transparency'],
                ['file-report', 'Create Report'],
              ].map(([icon, name]) => (
                <CalciteAction
                  icon={icon}
                  text={name}
                  scale="s"
                  onClick={() => setClicked((c) => !c)}
                  key={name}
                />
              ))}
            </CalciteActionBar>
          </MapWidget>
          <MapWidget position="top-left" key="geolevelview">
            <GeoTypeSelect />
          </MapWidget>
        </MapViewComponent>
      </CalciteShell>
    </MapContext.Provider>
  );
}
