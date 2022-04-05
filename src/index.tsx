import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { setAssetPath } from '@esri/calcite-components/dist/components';
import { CalcitePopoverManager } from '@esri/calcite-components-react';
import './calcite-imports';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Circle from '@arcgis/core/geometry/Circle';
import Point from '@arcgis/core/geometry/Point';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import App from './App';

// Local assets
setAssetPath(window.location.href);
function moveGraphic(graphic: Graphic, dx: number, dy: number) {
  const clonedGeometry = graphic.geometry.clone();
  const [rings] = [...graphic.geometry.rings];
  const t = rings.map(([x, y]) => {
    return [x + dx, y + dy];
  });
  clonedGeometry.rings = t;
  graphic.geometry = clonedGeometry;
}
const map = new Map({ basemap: 'gray-vector' });
const mapView = new MapView({ map, container: 'mapViewContainer' });

const graphicsLayer = new GraphicsLayer({});
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
map.add(graphicsLayer);

// Add the geometry and symbol to a new graphic
const polygonGraphic = new Graphic({
  geometry: polygon,
  symbol: fillSymbol,
});
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
requestAnimationFrame(animate);
