import React, { useRef, useEffect, useContext } from 'react';
import { MapContext } from './MapViewComponent';

interface MapWidgetProps {
  position: __esri.UIAddPosition;
  children?: React.ReactNode;
}

export default function MapWidget({
  position,
  children,
}: MapWidgetProps): JSX.Element {
  const widgetRef = useRef(null);
  const view = useContext(MapContext);

  useEffect(() => {
    const ref = widgetRef.current;
    if (ref) view?.ui.add(ref, position);
    return () => view?.ui.remove(ref);
  }, [position, view]);

  return <div ref={widgetRef}>{children}</div>;
}
