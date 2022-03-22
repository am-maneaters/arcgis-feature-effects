import MapView from '@arcgis/core/views/MapView';
import React, { useRef, useEffect, createContext } from 'react';

export const MapContext = createContext<MapView>(new MapView());

type MapViewComponentProps = { view: MapView; children?: React.ReactNode };

export default function MapViewComponent({
  view,
  children,
}: MapViewComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) view.container = mapRef.current;
  }, [view]);

  return (
    <div ref={mapRef} className="h-full">
      {children}
    </div>
  );
}
