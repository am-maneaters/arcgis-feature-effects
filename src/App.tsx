import * as React from 'react';

import { CalciteShell } from '@esri/calcite-components-react';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';

import TileLayer from '@arcgis/core/layers/TileLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Circle from '@arcgis/core/geometry/Circle';
import Point from '@arcgis/core/geometry/Point';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import useMap from './hooks/layerHooks';
import MapViewComponent, { MapWidget } from './components/Map';

import config from './config';
import Paper from './components/Paper';

interface Props {
  example?: string;
}

function moveGraphic(graphic: Graphic, dx: number, dy: number) {
  const clonedGeometry = graphic.geometry.clone();
  const [rings] = [...graphic.geometry.rings];
  const t = rings.map(([x, y]) => {
    return [x + dx, y + dy];
  });
  clonedGeometry.rings = t;
  graphic.geometry = clonedGeometry;
}

export default function App({ example }: Props) {
  const ref = React.useRef(0);
  const { mapView, useLayer, useMapEvent, useWidget } = useMap(
    {
      basemap: 'gray-vector',
    },
    {
      extent: config.initialExtent,
    }
  );

  const worldLayer = useLayer(
    'worldLayer',
    new TileLayer({
      portalItem: {
        id: '10df2279f9684e4a9f6a7f08febac2a9', // world imagery
      },
    })
  );

  worldLayer.effect = 'blur(8px) brightness(1.2) grayscale(0.8)';
  worldLayer.sublayers?.forEach((layer) => {
    layer.popupEnabled = false;
  });

  const graphicsLayer = useLayer('graphicsLayer', new GraphicsLayer({}));
  // Create a polygon geometry
  const polygon = new Circle({
    center: new Point({ x: -64.78, y: 32.3 }),
    numberOfPoints: 100,
    radius: 200,
    radiusUnit: 'kilometers',
  });

  // Create a symbol for rendering the graphic
  const fillSymbol = new SimpleFillSymbol({
    color: 'blue',
    style: 'solid',
    outline: {
      width: 3,
      color: 'red',
    },
  });

  // Add the geometry and symbol to a new graphic
  const polygonGraphic = new Graphic({
    geometry: polygon,
    symbol: fillSymbol,
  });
  // Add the geometry and symbol to a new graphic
  const polygonGraphic2 = new Graphic({
    geometry: polygon,
    symbol: fillSymbol,
  });
  graphicsLayer.graphics = [polygonGraphic, polygonGraphic2];

  const position = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0.01 };
  const speed = 0.01;

  const keyPressed = { w: false, a: false, s: false, d: false };
  mapView.on('key-down', (e) => {
    keyPressed[e.key] = true;
    e.stopPropagation();
  });

  mapView.on('key-up', (e) => {
    keyPressed[e.key] = false;
    e.stopPropagation();
  });

  const animate = () => {
    console.log();
    ref.current = 5;
    moveGraphic(polygonGraphic, velocity.x, velocity.y);
    if (keyPressed.a) {
      velocity.x -= speed;
    } else if (keyPressed.d) {
      velocity.x += speed;
    }
    if (keyPressed.w) {
      velocity.y += speed;
    } else if (keyPressed.s) {
      velocity.y -= speed;
    }
    velocity = { x: velocity.x * 0.9, y: velocity.y * 0.9 };
    return requestAnimationFrame(animate);
  };

  React.useEffect(() => {
    requestAnimationFrame(animate);
  }, []);

  useWidget(() => new ScaleBar(), { position: 'top-left' });

  return (
    <CalciteShell>
      {/*  Header Bar */}
      <h1 className="text-xl font-bold pl-4 pt-2" slot="header">
        ArcGIS Feature Effect
      </h1>
      <MapViewComponent view={mapView} key="mapview">
        <MapWidget position="bottom-right" key="legendview">
          <Paper>{ref.current}</Paper>
        </MapWidget>
      </MapViewComponent>
    </CalciteShell>
  );
}
