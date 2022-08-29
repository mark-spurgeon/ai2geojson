#include 'json.js'


const defaultConfig = {
    crs: {type: "name", properties: {name: "urn:ogc:def:crs:EPSG::2056"}},
    x: "2548324.817",
    y: "1126904.815",
    scale: "70000",
    ignore: '.',
}

function configToText(config) {
    return JSON.stringify(config, undefined, 2)
}
function textToConfig(text) {
    return JSON.parse(text)
}

function removeComments(str) {
    return str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'');
}

function p2m (p) {
    // Convert point units to metres
    // See : https://ai-scripting.docsforadobe.dev/scripting/measurementUnits.html#scripting-measurementunits-emspaceunits
    return p / 2834.645;
}

function getAllPaths (layer) {
    return layer.pathItems;
}

function readLayerObjects (layer, config) {
    var origin = processOrigin(config.x, config.y);
    var scale = Number(config.scale);
    var features = []
    var paths = getAllPaths(layer);
    for(var i = 0; i < paths.length; i++){
        var path = paths[i];
        var coordinates = [];
        for(var ii = 0; ii < path.pathPoints.length; ii++){
            var xy = path.pathPoints[ii].anchor;
            x = p2m(xy[0]) * scale + origin[0]
            y = p2m(xy[1]) * scale + origin[1]
            coordinates.push([x,y]);
        }
        var feature = {
            type: "Feature",
            properties: {id: i.toString()},
            geometry: {
                type: 'Polygon',
                coordinates: [ coordinates ]
            }
        }
        features.push(feature)
    }
    
    var cpaths = layer.compoundPathItems;
    for(var i = 0; i < cpaths.length; i++){
      var coordinates = [];
      var cpath = cpaths[i];
      var cpathItems = cpath.pathItems;
      for(var ci = 0; ci < cpathItems.length; ci++){
          var ring = [];
          var path = cpathItems[ci];
          for(var ii = 0; ii < path.pathPoints.length; ii++){
              var xy = path.pathPoints[ii].anchor;
              var x = p2m(xy[0]) * scale + origin[0];
              var y = p2m(xy[1]) * scale + origin[1];
              ring.push([x,y])
          }
          coordinates.push(ring);
      }
      var feature = {
          type: "Feature",
          properties: {id: i.toString()},
          geometry: {
            type: "Polygon",
            coordinates: coordinates,
          },
      }
      features.push(feature)
    }
    var geojson = {
        name: 'Layer',
        type: "FeatureCollection",
        crs: config.crs,
        features: features
    }
    return geojson;
}

function processOrigin(og_x, og_y) {
    return [Number(og_x.replace(',', '.')), Number(og_y.replace(',', '.'))]
}

const ai2shapefile = {
    // options
    layers: [],
    crs: 'EPSG:2056',
    scale: '75000',
    og_x: '2548324.817',
    og_y: '1126904.815',
    
    /** init : start plugin by starting dialog */
    init: function() {
            var ok = this.hasLayers();	
            if (ok) { this.show_dialog() }
        },
    /** just check if there are layers */
    hasLayers: function() {
            var parse_success = false;
            try {
                this.layers = app.activeDocument.layers;
        parse_success = true;
            } catch ( e ) {
            }
            return parse_success;
    },
    /** this is the UI */
    show_dialog: function() {
        this.dialog = new Window('dialog', 'cartographe - ai2geojson');
        // Input : Config
        var configrow = this.dialog.add('group', undefined, '')
        configrow.orientation = 'row';
        configrow.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.CENTER]
        var configInput = configrow.add('edittext', [0,0,480,200], configToText(defaultConfig), {multiline: true});
        // Comment
        var introw = this.dialog.add('group', undefined, '')
        introw.orientation = 'row';
        introw.add('statictext', undefined, 'Copy & paste this text with your config. Check out the docs'); 

        // Process
        var progressrow = this.dialog.add('group', undefined, '')
        progressrow.orientation = 'row';
        progressrow.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]
        var progress = progressrow.add("progressbar", undefined, 0, this.layers.length + 1);
        progress.preferredSize = [480, -1];

        // Export
        var exportrow = this.dialog.add('group', undefined, '')
        exportrow.orientation = 'row';
        exportrow.alignment = [ScriptUI.Alignment.RIGHT, ScriptUI.Alignment.TOP]
        var exportButton = exportrow.add('button', undefined, 'Export' );

        exportButton.onClick = function() {
            var config = textToConfig(configInput.text)
            var og = processOrigin(config.x, config.y);
            var sc = Number(config.scale);
            // for now, testing ground
                var layers = app.activeDocument.layers;
                var sourceFolder = Folder.selectDialog( 'Select the folder with Illustrator files you want to convert to PDF', '~' );
                for (var li = 0; li < layers.length; li++) {
                    var layer = layers[li];
                    if (layer.name.charAt(0) != '.') {
                        try {
                            var geojson = readLayerObjects(layer, config);
                        } catch (e) {
                            alert(e)
                        }
                        var text = JSON.stringify(geojson, null, 2);
                        var geo = new File(sourceFolder + '/' + layer.name + '.json'); 
                        geo.open('w');
                        geo.write(text);
                        geo.close();
                    }
                    setTimeout(function() {
                        progress.value ++;
                    }, 500)
                }
                // Executing commands is only available in >= CS6
                // ref: https://community.adobe.com/t5/illustrator-discussions/outline-stroke-with-illustrator-scripting/td-p/5943727
                // app.executeMenuCommand ('Live Outline Stroke');    
        }
        this.dialog.show()
    }
}

ai2shapefile.init()