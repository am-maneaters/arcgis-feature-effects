import Extent from '@arcgis/core/geometry/Extent';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';

type Config = {
  initialExtent: __esri.Extent;
};

const config: Config = {
  initialExtent: new Extent({
    xmax: -6576030,
    xmin: -15029354,
    ymax: 7498969,
    ymin: 1638389,
    spatialReference: SpatialReference.WebMercator,
  }),
};

export default config;
