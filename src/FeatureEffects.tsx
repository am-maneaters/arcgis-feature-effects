import * as React from 'react';

import {
  CalciteInput,
  CalciteShell,
  CalciteSwitch,
} from '@esri/calcite-components-react';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import { useState } from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import useMap from './hooks/layerHooks';
import MapViewComponent, { MapWidget } from './components/Map';
import LegendView from './views/LegendView';
import Paper from './components/Paper';
import { EffectArg, EffectArgSuffix, Effect } from './FeatureEffects';
import config from './config';

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

/**
 * Components needed to make effects
 *
 * Effect Inputs:
 *
 *
 *  */

type EffectInputProps<Args> = {
  effect: Effect;
  onArgsChange: (args: Args[]) => void;
  onEnabledChange: (enabled: boolean) => void;
};

function EffectInput({
  effect: { name, args },
  onArgsChange,
  onEnabledChange,
}: EffectInputProps<EffectArg>) {
  return (
    <div>
      <div>{name}</div>
      <div className="flex">
        <CalciteSwitch
          onCalciteSwitchChange={(e) => {
            onEnabledChange(e.detail.switched);
          }}
        />
        {args.map((arg, i) => (
          <CalciteInput
            className="w-40"
            type="number"
            value={arg.value}
            suffixText={arg.suffix}
            onCalciteInputInput={(e) => {
              const argsCopy = [...args];
              argsCopy[i].value = parseFloat(e.target.value);
              onArgsChange(argsCopy);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function joinEffects(effects: Effect[]): string {
  return effects
    .filter((effect) => effect.enabled)
    .map((effect) => {
      const { name, args } = effect;
      return `${name}(${args
        .map(({ value, suffix }) => `${value}${suffix ?? ''}`)
        .join(', ')})`;
    })
    .join(' ');
}

const unit = (suffix: EffectArgSuffix) => {
  return (value: number) => ({
    value,
    suffix,
  });
};
const px = unit('px');
const pct = unit('%');
const deg = unit('deg');

const defaultEffects: Effect[] = [
  {
    name: 'drop-shadow',
    args: [px(2), px(2), px(2)],
  },
  { name: 'brightness', args: [pct(100)] },
  { name: 'blur', args: [px(2)] },
  { name: 'grayscale', args: [pct(100)] },
  { name: 'contrast', args: [pct(100)] },
  { name: 'hue-rotate', args: [deg(90)] },
  { name: 'invert', args: [pct(100)] },
  { name: 'opacity', args: [pct(50)] },
  { name: 'saturate', args: [pct(100)] },
  { name: 'sepia', args: [pct(100)] },
];

export default function App({ example }: Props) {
  const [clicked, setClicked] = React.useState(false);
  const [highlightedFeatures, setHighlightedFeatures] = useState([24]);

  const [featureEffects, setFeatureEffects] =
    useState<Effect[]>(defaultEffects);

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

  const polyLayer = useLayer(
    'stateLayer',
    new FeatureLayer({
      url: 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/USStates/FeatureServer/0',
    })
  );
  const graphicsLayer = useLayer('graphicsLayer', new GraphicsLayer({}));
  // Create a polygon geometry
  const polygon = {
    type: 'polygon', // autocasts as new Polygon()
    rings: [
      [-64.78, 32.3],
      [-66.07, 18.45],
      [-80.21, 25.78],
      [-64.78, 32.3],
    ],
  };

  // Create a symbol for rendering the graphic
  const fillSymbol = {
    type: 'simple-fill', // autocasts as new SimpleFillSymbol()
    color: [227, 139, 79, 0.8],
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: [255, 255, 255],
      width: 1,
    },
  };

  // Add the geometry and symbol to a new graphic
  const polygonGraphic = new Graphic({
    geometry: polygon,
    symbol: fillSymbol,
  });
  graphicsLayer.graphics.push(polygonGraphic);

  const combinedEffects = joinEffects(featureEffects);

  React.useEffect(() => {
    polyLayer.featureEffect = new FeatureEffect({
      filter: new FeatureFilter({
        objectIds: highlightedFeatures,
        // Need to include this for when highlightedFeatures is empty
        // An empty objectIds array applies the effect to all features
        where: highlightedFeatures.length === 0 ? '1=2' : '1=1',
      }),
      includedEffect: combinedEffects,
    });
  }, [combinedEffects, highlightedFeatures, polyLayer]);

  useMapEvent('double-click', [], (event) => {
    event.stopPropagation();
  });
  useMapEvent('double-click', ['Control'], (event) => {
    event.stopPropagation();
  });

  useMapEvent('immediate-click', [], async (event) => {
    const { results } = await mapView.hitTest(event, {
      include: [polyLayer],
    });
    if (results.length > 0) {
      const clickedID = results[0].graphic.getObjectId();
      if (highlightedFeatures.includes(clickedID)) {
        setHighlightedFeatures((graphics) =>
          graphics.filter((id) => id !== clickedID)
        );
      } else {
        setHighlightedFeatures((graphics) => [...graphics, clickedID]);
      }
    }
  });

  React.useEffect(() => {
    let velocity = { x: 0, y: 0.01 };
    const speed = 0.1;

    const 

    mapView.on('key-down', (event) => {
      const { key } = event;
      if (key === 'w') {
        velocity.y += speed;
      } else if (key === 's') {
        velocity.y -= speed;
      } else if (key === 'a') {
        velocity.x -= speed;
      } else if (key === 'd') {
        velocity.x += speed;
      }
    });
    const animate = () => {
      moveGraphic(polygonGraphic, velocity.x, velocity.y);
      velocity = { x: velocity.x * 0.9, y: velocity.y * 0.9 };
      return requestAnimationFrame(animate);
    };
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
          <LegendView test={clicked} />
        </MapWidget>
        <MapWidget position="bottom-left" key="dashboardview">
          <Paper>
            {featureEffects.map((effect, i) => (
              <EffectInput
                effect={effect}
                onArgsChange={(newArgs) => {
                  setFeatureEffects((effects) => {
                    const effectsCopy = [...effects];
                    effectsCopy[i].args = newArgs;
                    return effectsCopy;
                  });
                }}
                onEnabledChange={(enabled) => {
                  setFeatureEffects((effects) => {
                    const effectsCopy = [...effects];
                    effectsCopy[i].enabled = enabled;
                    return effectsCopy;
                  });
                }}
              />
            ))}
          </Paper>
        </MapWidget>
      </MapViewComponent>
    </CalciteShell>
  );
}
