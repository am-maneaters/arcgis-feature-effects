import React from 'react';
import { Button, Paper, Popover } from '@mui/material';
import DataVariableSelect from '../DataVariableSelect/VariableSelect';

type Props = {};

export default function ControlBar({}: Props) {
  const [popoverRefId, setPopoverRefId] = React.useState<Element>();
  const [editing, setEditing] = React.useState<
    'Industry' | 'Location' | 'Variable' | 'Filter' | undefined
  >(undefined);

  return (
    <Paper className="h-20 flex justify-between items-stretch">
      {[
        ['Industry', 'Mining and Construction'],
        ['Location', 'Scott County, Minnesota'],
        ['Variable', 'Total Population'],
        ['Filter', '18 to 64 years'],
      ].map(([name, val]) => (
        <div
          key={name}
          className="aspect-auto w-16 text-sm flex-1 p-2 border-r-2"
        >
          <div className="text-sm italic">{name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div className="font-bold text-md">{val}</div>
            <Button
              onClick={(evt) => {
                setEditing(name);
                setPopoverRefId(evt.currentTarget);
              }}
            >
              Edit
            </Button>
          </div>
        </div>
      ))}

      <Popover
        anchorEl={popoverRefId}
        open={popoverRefId !== undefined}
        onClose={() => setPopoverRefId(undefined)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <DataVariableSelect />
      </Popover>
    </Paper>
  );
}
