import React, { useContext, useEffect, useRef } from 'react';
import EsriLegend from '@arcgis/core/widgets/Legend';
import { MapContext } from '../components/Map/MapViewComponent';
import Paper from '../components/Paper';

type Props = { test: boolean };

export default function LegendView({ test }: Props) {
  const legendRef = useRef<HTMLElement>(null);
  const mapView = useContext(MapContext);

  useEffect(() => {
    if (!legendRef.current?.hasChildNodes())
      new EsriLegend({
        view: mapView,
        container: legendRef.current,
      });
  }, [mapView, test]);

  return (
    <Paper>
      Legend {test}
      <div ref={legendRef} />
    </Paper>
  );
}
