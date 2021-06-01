module.exports = {
  landingPage: () => {
    const { baseurl, title, description } = process.env;
    return {
      "title": title || "OGC API",
      "description": description || "",
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document",
          "href": baseurl + "?f=json"
        },
        {
          "rel": "conformance",
          "type": "application/json",
          "title": "OGC API conformance classes implemented by this server",
          "href": baseurl + "/conformance"
        },
        {
          "rel": "service-desc",
          "type": "application/vnd.oai.openapi+json;version=3.0",
          "title": "OpenAPI 3.0 Definition of the API in json",
          "href": baseurl + "/api/json"
        },
        {
          "rel": "service-desc",
          "type": "application/vnd.oai.openapi;version=3.0",
          "title": "OpenAPI 3.0 Definition of the API in yaml",
          "href": baseurl + "/api/yaml"
        },
        {
          "rel": "service-doc",
          "type": "text/html",
          "title": "Documentation of the API",
          "href": baseurl + "/api/static/index.html"
        },
        {
          "rel": "data",
          "type": "application/json",
          "title": "Access the data",
          "href": baseurl + "/collections?f=json"
        },
        {
          "rel": "tiling-schemes",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/tileMatrixSets"
        },
        {
          "rel": "tiles",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/tiles"
        },
        {
          "rel": "styles",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/styles"
        },
        {
          "rel": "map",
          "title": "List of tile matrix sets implemented by this API",
          "href": baseurl + "/map"
        },
      ],
      "extent": {
        "spatial": {
          "bbox": [
            [
              35.7550727,
              32.3573507,
              37.2052764,
              33.2671397
            ]
          ],
          "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
        },
        "temporal": {
          "interval": [
            [
              "2009-03-15T11:18:23Z",
              "2015-12-28T15:16:51Z"
            ]
          ],
          "trs": "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian"
        }
      }
    }

  },

  conformance: () => {
    return [
      "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/collections",

      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',

      "http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/core",
      "http://www.opengis.net/spec/ogcapi-tiles-1/1.0/req/tileset",

      "http://www.opengis.net/spec/ogcapi-maps-1/1.0/req/core"
    ]
  },

  collections: collections => {
    const { baseurl } = process.env;

    return {
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": baseurl + "/collections?f=json"
        },
        {
          "rel": "alternate",
          "type": "text/html",
          "title": "This document as HTML",
          "href": baseurl + "/collections?f=html"
        },
        {
          "rel": "enclosure",
          "type": "application/vnd.sqlite3",
          "title": "Download dataset behind API",
          "href": baseurl + "/download"
        }
      ],
      "collections": collections.map(collection => module.exports.collection(collection))
    }
  },

  collection: collection => {
    const { baseurl } = process.env;
    const { table_name, extent_min_x, extent_min_y, extent_max_x, extent_max_y } = collection;

    return {
      "id": table_name,
      "title": table_name,
      "description": "",
      "extent": {
        "spatial": [
          extent_min_y,
          extent_min_x,
          extent_max_x,
          extent_max_y
        ]
      },
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": baseurl + "/collections/" + table_name + "?f=json"
        },
        {
          "rel": "alternate",
          "type": "text/html",
          "title": "This document as HTML",
          "href": baseurl + "/collections/" + table_name + "?f=html"
        },
        {
          "rel": "items",
          "type": "application/geo+json",
          "title": "Access the features in the collection as GeoJSON",
          "href": baseurl + "/collections/" + table_name + "/items?f=json"
        },
        {
          "rel": "items",
          "type": "text/html",
          "title": "Access the features in the collection as HTML",
          "href": baseurl + "/collections/" + table_name + "/items?f=html"
        },
        {
          "rel": "tiling-schemes",
          "type": "application/vnd.vector-tile",
          "title": "Access the features in the collection as Vector tiles",
          "href": baseurl + "/collections/" + table_name + "/tiles"
        },
        {
          "rel": "tiles",
          "type": "application/vnd.vector-tile",
          "title": "Access the features in the collection as Vector tiles",
          "href": baseurl + "/collections/" + table_name + "/tiles/{tileMatrixSetId}/{tileMatrixId}/{tileRow}/{tileCol}"
        }
      ]
    }
  },

  tilesSets: (collectionId) => {
    const { baseurl, title, desc } = process.env;

    const collectionPath = collectionId? "/collections/" + collectionId : ""

    return {
      "title": title || "OGCAPI",
      "description": desc || "",
      "links": [{
        "rel": "self",
        "type": "application/json",
        "title": "The JSON representation of the available map tilesets for the dataset",
        "href": baseurl + collectionPath + "/tiles?f=json"
      },
      {
        "rel": "item",
        "type": "application/vnd.mapbox-vector-tile",
        "title": "Mapbox vector tiles; the link is a URI template where {tileMatrix}/{tileRow}/{tileCol} is the tile based on the tiling scheme {tileMatrixSetId}",
        "href": baseurl + collectionPath + "/tiles/{tileMatrixSetId}/{z}/{x}/{y}",
        "templated": true
      },
      {
        "rel": "describedby",
        "type": "application/json",
        "title": "Metadata for these tiles in the TileJSON format",
        "href": baseurl + collectionPath + "/tiles/{tileMatrixSetId}",
        "templated": true
      }
      ],
      "tileMatrixSetLinks": [
        {
          "tileMatrixSet": "WebMercatorQuad",
          "tileMatrixSetURI": "http://www.opengis.net/def/tilematrixset/OGC/1.0/WebMercatorQuad",
          "tileMatrixSetDefinition": baseurl + "/tileMatrixSets/WebMercatorQuad",
        }
      ]
    }
  },

  vector_layer: (layer) => {
    const geometryMap = {
      "POINT":"point",
      "MULTIPOINT":"point",
      "LINESTRING": "line",
      "MULTILINESTRING": "line",
      "POLYGON":"polygon",
      "MULTIPOLYGON":"polygon"
    }

    const typeMap = {
      "INTEGER":"integer",
      "BIGINT":"integer",
      "FLOAT": "integer",
      "VARCHAR": "string",
      "DATE":"string, format=date or date-time",
    }

    const columns = layer.sql.substring(layer.sql.indexOf("(")+1, layer.sql.length - 1).split(",").map(e=>e.split(" "))
    const geometry_type = geometryMap[columns.filter(e=>e[1].substring(1,e[1].length-1).toLowerCase()==layer.geometry_column)[0][2]]
    const fields = columns.reduce((obj, cur) => ({...obj, [cur[1].substring(1,cur[1].length-1).toLowerCase()]: typeMap[cur[2].replace(/[^a-zA-Z]/g, '')] }), {})

    return {
      "id": layer.name,
      "description": "",
      "geometry_type": geometry_type,
      "minzoom": 0,
      "maxzoom": 18,
      "fields": fields
    }
    
  },

  tileJSON: (layers,collectionId) => {
    const { baseurl, title, desc } = process.env;
    const collectionPath = collectionId? "/collections/" + collectionId : ""

    const w = Math.min(...layers.map(layer=>layer.extent_min_x))
    const s = Math.min(...layers.map(layer=>layer.extent_min_y))
    const e = Math.max(...layers.map(layer=>layer.extent_max_x))
    const n = Math.max(...layers.map(layer=> layer.extent_max_y))

    return {
      "tilejson": "3.0.0",
      "name": title || "OGCAPI",
      "description": desc || "",
      "tiles": [baseurl + collectionPath + "/tiles/WebMercatorQuad/{z}/{y}/{x}"],
      "vector_layers": layers.map(layer => module.exports.vector_layer(layer)),
      "bounds": [w,s,e,n],
      "center": [(e+w)/2, (n+s)/2, 7],
      "minzoom": 0,
      "maxzoom": 18
    };
  },

  tileMatrixsets: () => {
    const { baseurl } = process.env;

    return {
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document",
          "href": baseurl + "/tileMatrixSets?f=json"
        },
        {
          "rel": "alternate",
          "type": "text/html",
          "title": "This document as HTML",
          "href": baseurl + "/tileMatrixSets?f=html"
        }
      ],
      "tileMatrixSets": [
        {
          "id": "WebMercatorQuad",
          "title": "Google Maps Compatible for the World",
          "links": [
            {
              "rel": "item",
              "title": "Tile matrix set 'WebMercatorQuad'",
              "href": baseurl + "/tileMatrixSets/WebMercatorQuad"
            }
          ]
        }
      ]
    }
  },

  tileMatrix: () => {
    const { baseurl } = process.env;

    return {
      "id": "WebMercatorQuad",
      "title": "Google Maps Compatible for the World",
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document",
          "href": baseurl + "/tileMatrixSets/WebMercatorQuad?f=json"
        }
      ],
      "type": "TileMatrixSetType",
      "supportedCRS": "http://www.opengis.net/def/crs/EPSG/0/3857",
      "wellKnownScaleSet": "http://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible",
      "boundingBox": {
        "type": "BoundingBoxType",
        "lowerCorner": [
          -20037508.3427892,
          -20037508.3427892
        ],
        "upperCorner": [
          20037508.3427892,
          20037508.3427892
        ]
      },
      "tileMatrix": [
        {
          "identifier": "0",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 1,
          "matrixHeight": 1,
          "scaleDenominator": 559082264.0287178,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "1",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 2,
          "matrixHeight": 2,
          "scaleDenominator": 279541132.0143589,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "2",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 4,
          "matrixHeight": 4,
          "scaleDenominator": 139770566.00717944,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "3",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 8,
          "matrixHeight": 8,
          "scaleDenominator": 69885283.00358972,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "4",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 16,
          "matrixHeight": 16,
          "scaleDenominator": 34942641.50179486,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "5",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 32,
          "matrixHeight": 32,
          "scaleDenominator": 17471320.75089743,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "6",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 64,
          "matrixHeight": 64,
          "scaleDenominator": 8735660.375448715,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "7",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 128,
          "matrixHeight": 128,
          "scaleDenominator": 4367830.1877243575,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "8",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 256,
          "matrixHeight": 256,
          "scaleDenominator": 2183915.0938621787,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "9",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 512,
          "matrixHeight": 512,
          "scaleDenominator": 1091957.5469310894,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "10",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 1024,
          "matrixHeight": 1024,
          "scaleDenominator": 545978.7734655447,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "11",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 2048,
          "matrixHeight": 2048,
          "scaleDenominator": 272989.38673277234,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "12",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 4096,
          "matrixHeight": 4096,
          "scaleDenominator": 136494.69336638617,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "13",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 8192,
          "matrixHeight": 8192,
          "scaleDenominator": 68247.34668319309,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "14",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 16384,
          "matrixHeight": 16384,
          "scaleDenominator": 34123.67334159654,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "15",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 32768,
          "matrixHeight": 32768,
          "scaleDenominator": 17061.83667079827,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "16",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 65536,
          "matrixHeight": 65536,
          "scaleDenominator": 8530.918335399136,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "17",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 131072,
          "matrixHeight": 131072,
          "scaleDenominator": 4265.459167699568,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        },
        {
          "identifier": "18",
          "tileWidth": 256,
          "tileHeight": 256,
          "matrixWidth": 262144,
          "matrixHeight": 262144,
          "scaleDenominator": 2132.729583849784,
          "topLeftCorner": [
            -20037508.3427892,
            20037508.3427892
          ],
          "type": "TileMatrixType"
        }
      ]
    }
  },

  geojson: feature => {
    const properties = Object.fromEntries(
      Object.entries(feature)
        .filter(([key, value]) => key != Object.keys(feature)[0])
        .filter(([key, value]) => key != "geojson")
        .filter(([key, value]) => typeof (value) != "object")
    )

    return {
      "id": Object.values(feature)[0],
      "type": "Feature",
      "properties": properties,
      "geometry": JSON.parse(feature.geojson)
    }
  },

  links: (baseurl, url) => {
    return [
      {
        "rel": "self",
        "type": "application/geo+json",
        "title": "Access the features in the collection as GeoJSON",
        "href": baseurl + url
      },
      {
        "rel": "self",
        "type": "text/html",
        "title": "Access the features in the collection as HTML",
        "href": baseurl + url.replace("f=json", "f=html")
      }
    ]
  },

  styles: (styles) => {
    const { baseurl } = process.env;

    return {
      "links": [
        {
          "rel": "self",
          "type": "application/json",
          "title": "This document as JSON",
          "href": baseurl + "/styles?f=json"
        }
      ],
      "styles": styles.map(style => module.exports.style(style))
    }

  },

  style: (style) => {
    const { baseurl } = process.env;

    return {
      "id": style.id,
      "title": style.title || style.id,
      "links": [
        {
          "href": baseurl + "/styles/" + style.id + "?f=mapbox",
          "type": "application/vnd.mapbox.style+json",
          "rel": "stylesheet"
        },
        {
          "href": baseurl + "/styles/" + style.id + "/metadata?f=json",
          "type": "application/json",
          "rel": "describedby"
        }
      ]
    }
  },

  styleMetadata: (style) => {
    const { baseurl } = process.env;
    return {
      "id": style.id,
      "title": style.title || style.id,
      "scope": "style",
      "stylesheets": [
        {
          "title": "Mapbox Style",
          "version": "8",
          "specification": "https://docs.mapbox.com/mapbox-gl-js/style-spec/",
          "native": true,
          "tilingScheme": "webmercator",
          "link": {
            "href": baseurl + "/styles/" + style.id + "?f=mapbox",
            "type": "application/vnd.mapbox.style+json",
            "rel": "stylesheet"
          }
        }
      ],
      "links": [
        {
          "href": baseurl + "/styles/" + style.id + "/metadata?f=json",
          "type": "application/json",
          "rel": "self"
        }
      ]
    }
  },

  mapDesc: (styles) => {
    const { baseurl } = process.env;
    return {
      "styles": styles.map(style => {
        return {
          "id": style.id,
          "links": [{
            "href": baseurl + "/map/" + style.id + "?f=png",
            "type": "image/png",
            "rel": "subset"
          }, {
            "href": baseurl + "/map/" + style.id + "?f=jpeg",
            "type": "image/jpeg",
            "rel": "subset"
          }, {
            "href": baseurl + "/styles/" + style.id + "?f=mapbox",
            "type": "application/vnd.mapbox.style+json",
            "rel": "stylesheet"
          }]
        }
      }),
      "maxWidth": 4096,
      "maxHeight": 4096,
      "extent": {
        "spatial": {
          "bbox": [
            [
              -8.7564981947375,
              49.8147371614082,
              1.8481470870055,
              60.9480162305518
            ]
          ],
          "envelope": {
            "Lat": [
              49.8147371614082,
              60.9480162305518
            ],
            "Lon": [
              -8.7564981947375,
              1.8481470870055
            ]
          }
        }
      },
      "crs": [
        "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
      ],
      "links": [
        {
          "href": baseurl + "/map?f=json",
          "type": "application/json",
          "rel": "self"
        }
      ]
    }
  }
}