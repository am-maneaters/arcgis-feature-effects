import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { setAssetPath } from '@esri/calcite-components/dist/components';
import { CalcitePopoverManager } from '@esri/calcite-components-react';
import App from './App';

import '@esri/calcite-components/dist/components/calcite-popover-manager';

// Local assets
setAssetPath(window.location.href);

ReactDOM.render(
  <CalcitePopoverManager>
    <App />
  </CalcitePopoverManager>,
  document.getElementById('root')
);
