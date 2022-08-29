### mark spurgeon's
# ai2geojson

Export Adobe illustrator (Ai) layers to geojson files

----

Features :

- For each layer, it exports **polygons** to a GeoJSON layer
- Support for compound paths, meaning polygons can have holes.

Things to consider

- Only polygons without straight lines are supported. To export a curve, outline its stroke, add anchor points multiple times and simplify with the 'straight lines' option.

Todo : 

- Recognise line / polygon depending on fill or stroke parameters
- Recognise color and set style definition according to that
- See if we can add attributes to objects
- Save options and file output as cache


## install

Download this file. When opening Ai, choose this script. Beware that it depends on `json.js`

## usage

To correctly establish a link between an ai/pdf map and geodata, we need a way to georeference the map. To do this, **ai2geojson** requires a series of attributes 

| attribute | required | description |
|---|---|---|
|x|yes|The left origin of the map|
|y|yes|The bottom origin of the map|
|scale|yes|The metric scale of the map *1:xxx* |
|crs|no| The CRS in ogc format|
|ignore|no| The pattern for layers ai2geojson should ignore|


