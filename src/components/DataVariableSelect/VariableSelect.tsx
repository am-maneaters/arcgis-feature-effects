import React, { useEffect, useMemo, useState } from 'react';

import '@esri/calcite-components/dist/components/calcite-modal';
import {
  List,
  ListItemButton,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import variableCategories from '../../metadata/variableCategories';
import Paper from '../Paper';
import dataVariables from '../../metadata/dataVariables';

type Props = {};
const parentCategories = variableCategories.filter(
  (category) => category.ParentID === undefined
);

export default function DataVariableSelect({}: Props) {
  const [primaryId, setPrimaryId] = useState<string>(parentCategories[0].ID);
  const [secondaryId, setSecondaryId] = useState<string | undefined>();
  const [selectedVar, setSelectedVar] = useState<string | undefined>();

  const children = useMemo(
    () => variableCategories.filter(({ ParentID }) => ParentID === primaryId),
    [primaryId]
  );

  useEffect(() => {
    if (children.length > 0) {
      setSecondaryId(children[0].ID);
    } else {
      setSecondaryId(undefined);
    }
  }, [children]);

  const availableVars = dataVariables.filter(
    ({ Variable_Categories, ParentID }) =>
      Variable_Categories.includes(primaryId) &&
      (secondaryId === undefined || Variable_Categories.includes(secondaryId))
  );

  return (
    <Paper className="flex gap-2 h-96">
      <div>
        {parentCategories.map((category) => (
          <div />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        Primary Category
        <ToggleButtonGroup
          orientation="vertical"
          exclusive
          onChange={(e, newVal) => setPrimaryId(newVal)}
          value={primaryId}
          color="primary"
        >
          {parentCategories.map(({ ID, Name }) => (
            <ToggleButton value={ID}>{Name}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      {children.length > 0 && (
        <div className="flex flex-col">
          Secondary Category
          <ToggleButtonGroup
            orientation="vertical"
            value={secondaryId}
            onChange={(e, newVal) => setSecondaryId(newVal)}
            exclusive
          >
            {children.map(({ Name, ID }) => (
              <ToggleButton value={ID} key={ID}>
                {Name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      )}
      {availableVars.length > 0 && (
        <List style={{ overflow: 'auto' }}>
          Data variables
          {availableVars.map(({ Name, ID }) => (
            <>
              <ListItemButton>
                <ListItemText key={ID}>{Name}</ListItemText>
              </ListItemButton>
              {availableVars
                .filter(({ ParentID }) => ParentID === ID)
                .map((c) => (
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText>{c.Name}</ListItemText>
                  </ListItemButton>
                ))}
            </>
          ))}
        </List>
      )}
    </Paper>
  );
}
