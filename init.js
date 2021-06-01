
const defStyle = (baseurl, table_name, geometry_type) => {
    const types = [null, "circle", "line", "fill", "circle", "line", "fill"]
    const type = types[+(geometry_type + '').slice(-1)]

    return {
        "version": 8,
        "name": table_name + ":default",
        "glyphs": baseurl + "/resources/fonts/{fontstack}/{range}",
        "sources": {
            "sat-tiles": {
                "type": "raster",
                "tiles": [
                    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2019_3857/default/g/{z}/{y}/{x}.jpg"
                ],
                "scheme": "xyz",
                "tileSize": 256
            },
            "vectortiles": {
                "type": "vector",
                "tiles": [
                    baseurl + "/collections/" + table_name + "/tiles/webmercator/{z}/{x}/{y}"
                ],
                "scheme": "xyz",
                "minzoom": 10,
                "maxzoom": 14
            }
        },
        "layers": [
            {
                "id": "sat-tiles",
                "type": "raster",
                "source": "sat-tiles",
                "paint": {
                    "raster-saturation": -0.8
                }
            },
            {
                "id": table_name,
                "type": type,
                "source": "vectortiles",
                "source-layer": table_name,
                "paint": {
                    [type + "-color"]: "red",
                    [type + "-opacity"]: [
                        "case",
                        [
                            "boolean",
                            [
                                "feature-state",
                                "hover"
                            ],
                            false
                        ],
                        0.8,
                        0.4
                    ]
                }
            }

        ]
    }
}


module.exports = {
    styles: () => {
        const loki = require('lokijs')

        const collections = globalThis.db.prepare('SELECT * FROM vector_layers_statistics LEFT JOIN geometry_columns on table_name=f_table_name WHERE row_count>0 ').all();

        globalThis.loki = new loki('datastore.db', {
            autosave: true,
            autosaveInterval: 4000
        });

        globalThis.loki.addCollection("styles")

        globalThis.styles = globalThis.loki.getCollection("styles")

        collections.forEach(collection => {
            /*{
                layer_type: 'SpatialTable',
                table_name: 'vandloebsmidte_brudt',
                geometry_column: 'geometry',
                last_verified: '2021-05-30T20:12:42.198Z',
                row_count: 882470,
                extent_min_x: 8.092321950577162,
                extent_min_y: 54.56767678681486,
                extent_max_x: 15.155803094198436,
                extent_max_y: 57.74429257566405
            }
            */
            const { baseurl } = process.env;
            const { table_name, geometry_type } = collection;

            globalThis.styles.insert({ "collection": table_name, "id": "default", "style": defStyle(baseurl, table_name, geometry_type) })

        })

    },

    puppeteer: async () => {
        const puppeteer = require('puppeteer');
        const path = require('path');
        console.log(process.pkg, puppeteer.executablePath())
        const options = typeof process.pkg !== 'undefined' ?
            {
                executablePath: puppeteer.executablePath().replace(/^.*?\\node_modules\\puppeteer\\\.local-chromium/, path.join(path.dirname(process.execPath), '.local-chromium'))
            }
            :
            {};
        globalThis.browser = await puppeteer.launch(options);
    }

}