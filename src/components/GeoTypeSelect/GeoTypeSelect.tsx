import { Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useContext } from 'react';
import { useWatchState } from '../../hooks/watchHooks';
import geoTypes from '../../metadata/geoTypes';
import { MapContext } from '../Map/MapViewComponent';

type Props = {};

// Only use GeoTypes that are not for compare only
const availableGeoTypes = geoTypes.filter(
  (geoType) => !geoType.IsForComparisonOnly
);

export default function GeoTypeSelect({}: Props) {
  // Get the map context so we can get the current zoom level
  const map = useContext(MapContext);

  // Currently selected GeoType
  const [selectedGeoType, setSelectedGeoType] = React.useState<string>(
    availableGeoTypes[0].ID
  );

  // Use the current zoom level on the map
  const zoom = useWatchState(map, 'zoom');

  // Get a list of GeoTypes that should be disabled by ID
  const disabledGeoTypeIds = availableGeoTypes
    .filter(
      ({ drawingProperties }) =>
        drawingProperties?.DisableBelow && drawingProperties.DisableBelow > zoom
    )
    .map(({ ID }) => ID);

  /** Helper Functions */
  const onGeoTypeChange = (evt: unknown, val: string) => {
    setSelectedGeoType(val);
  };

  return (
    <Paper
      style={{
        top: 0,
        left: 40,
        pointerEvents: 'auto',
        position: 'absolute',
      }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        onChange={onGeoTypeChange}
        value={selectedGeoType}
        color="primary"
      >
        {availableGeoTypes.map(({ Name, ID, drawingProperties }) => (
          <ToggleButton
            disabled={disabledGeoTypeIds.includes(ID)}
            value={Name}
            key={ID}
            // Enable this to automatically zoom to GeoType that is disabled
            // onClick={() => {
            //   if (disabledGeoTypeIds.includes(ID)) {
            //     map.goTo({ zoom: drawingProperties?.DisableBelow as number });
            //   }
            // }}
          >
            {Name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Paper>
  );
}
