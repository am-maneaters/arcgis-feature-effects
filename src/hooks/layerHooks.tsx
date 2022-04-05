import MapView from '@arcgis/core/views/MapView';
import Map from '@arcgis/core/Map';

import React, { useCallback, useEffect, useState } from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as watchUtils from '@arcgis/core/core/watchUtils';
import Layer from '@arcgis/core/layers/Layer';

/**
 * Constructs a map and a mapview and returns various map hooks
 * @param mapProps Map Constructor Properties
 * @param mapViewProps Map View Constructor Properties
 * @returns Reference to mapView and useful hooks
 */
export default function useMap(
  mapProps: __esri.MapProperties,
  mapViewProps: Exclude<__esri.MapViewProperties, 'map' | 'container'>
) {
  const [mapView] = useState(() => {
    const map = new Map(mapProps);

    const view = new MapView({
      ...mapViewProps,
      map,
    });
    return view;
  });

  function useLayer<LayerType extends __esri.Layer>(
    id: string,
    initLayer: LayerType
  ): LayerType {
    let layer = mapView.map.findLayerById(id) as LayerType;
    if (!layer) {
      layer = initLayer;
      layer.id = id;
      mapView.map.add(layer);
    }
    return layer;
  }

  /**
   * Hook wrapper around {@link MapView.on}
   */
  const useMapEvent = (
    event: string | string[],
    modifiers: string[],
    handler: __esri.EventHandler
  ) => {
    useEffect(() => {
      const handle = mapView.on(event, modifiers, handler);
      return () => handle.remove();
    }, [event, handler, modifiers]);
  };

  /**
   * Add a pre-defined widget to the view, specifying it's position
   * @param widget
   * @param position
   */
  function useWidget(
    widget: () => __esri.Widget,
    position: __esri.UIAddPosition
  ) {
    useEffect(() => {
      if (!widget) return;
      const newWidget = widget() as __esri.Widget & { view: MapView };
      newWidget.view = mapView;
      mapView.ui.add(newWidget, position);

      return () => {
        mapView.ui.remove(newWidget);
      };
    }, [widget, position]);
  }

  /** Triggers a callback whenever the user has finished changing the MapExtent.
   *  For example, this means this event only triggers when users finish dragging the map.
   *  Contains special case for when user simply clicks on the map as that normally triggers this event.
   */
  function useExtentChanged(fn: (extent: __esri.Extent) => void) {
    const [extent, setExtent] = useState<__esri.Extent>(mapView.extent);
    useEffect(() => {
      if (!mapView) return () => {};

      const handle = watchUtils.whenTrue(mapView, 'stationary', () => {
        // Only update when the extent has actually changed
        if (extent !== mapView.extent) fn(mapView.extent);

        setExtent(mapView.extent);
      });
      return () => {
        handle.remove();
      };
    }, [extent, fn]);
  }

  return { useLayer, mapView, useMapEvent, useWidget, useExtentChanged };
}
