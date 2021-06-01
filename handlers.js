const format = require('./formats');
const fs = require('fs')

module.exports = {
  getLandingpage: async (req, reply, fastify) => {
    const { f } = req.query;

    if (f == "json") reply.send(format.landingPage())
    else {
      const content = fs.createReadStream(__dirname + '/views/landingpage.html')
      reply.type('text/html').send(content)
    }
  },

  getConformance: async (req, reply, fastify) => {
    reply.send(format.conformance())
  },

  getEnclosure: async (req, reply, fastify) => {
    const { database } = process.env;

    reply.header('Content-disposition', 'attachment; filename=' + database.split("\\").pop());
    reply.header('Content-Type', 'application/vnd.sqlite3');
    reply.send(require('fs').createReadStream(database, 'utf8'))

  },

  getCollections: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    const { f } = req.query;

    const collections = globalThis.db.prepare('SELECT table_name, extent_min_x, extent_min_y, extent_max_x, extent_max_y FROM vector_layers_statistics WHERE row_count>0').all();
    const formattedCollections = format.collections(collections);

    if (f == "json") {
      reply.send(formattedCollections)
    }

    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/collections.html', { locals: { baseurl: baseurl, data: formattedCollections } })

      reply.type('text/html').send(content)

    }
  },

  getCollection: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    const { collectionId } = req.params;
    const { f } = req.query;

    const collection = globalThis.db.prepare("SELECT table_name, extent_min_x, extent_min_y, extent_max_x, extent_max_y FROM vector_layers_statistics WHERE table_name=?").get(collectionId);
    const formattedCollection = format.collection(collection);

    if (f == "json") {
      reply.send(format.collection(collection))
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/collection.html', { locals: { baseurl: baseurl, collection: formattedCollection } })

      reply.type('text/html').send(content)
    }

  },

  getItems: async (req, reply, fastify) => {
    const { baseurl } = process.env;

    const { collectionId } = req.params;
    let { limit, offset, bbox, f, token, ...options } = req.query;


    if (f == "json") {
      const { row_count, geometry_column } = globalThis.db.prepare("SELECT row_count, geometry_column FROM vector_layers_statistics WHERE table_name=?").get(collectionId);

      const where = Object.entries(options).map(e => e[0] + " = '" + unescape(e[1]) + "'").join(" AND ")

      const features = globalThis.db.prepare(`
        SELECT ROWID, *, AsGeoJSON(${geometry_column},6) geojson 
        FROM  ${collectionId}
        WHERE 
          ${where ? " " + where : "1=1"}
          ${bbox ? `AND ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = '${collectionId}' and f_geometry_column = '${geometry_column}'  AND search_frame = BuildMbr(${bbox.toString()}) )` : ""} 
        LIMIT ${offset ? offset + ", " : ""} ${limit ? limit : 10}
      `).all();


      reply.send({
        type: "FeatureCollection",
        features: features.map(feature => format.geojson(feature)),
        numberReturned: features.length,
        numberTotal: row_count,
        timeStamp: new Date().toISOString(),
        links: format.links(baseurl, req.url)
      })
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/items.html', { locals: { baseurl: baseurl, collectionId: collectionId } })

      reply.type('text/html').send(content)
    }

  },

  getItem: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    const { collectionId, featureId } = req.params;
    const { f } = req.query;

    if (f == "json") {
      const { geometry_column } = globalThis.db.prepare("SELECT geometry_column FROM vector_layers_statistics WHERE table_name=?").get(collectionId);

      const feature = globalThis.db
        .prepare(`
          SELECT ROWID, *, AsGeoJSON(${geometry_column},6) geojson 
          FROM  ${collectionId}
          WHERE ROWID = ${featureId}
      `).get();

      reply.send({
        type: "FeatureCollection",
        features: [format.geojson(feature)],
        timeStamp: new Date().toISOString(),
        links: format.links(baseurl, req.url)
      })
    }
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/item.html', { locals: { baseurl: baseurl, collectionId: collectionId, featureId: featureId } })

      reply.type('text/html').send(content)
    }

  },

  getSingleLayerTilesDesc: async (req, reply, fastify) => {
    const { collectionId } = req.params;

    reply.send(format.tilesSets(collectionId))
  },

  getMultiLayerTilesDesc: async (req, reply, fastify) => {
    const { f } = req.query;

    if (f == "json") reply.send(format.tilesSets())
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/tiles.html', {})
      reply.type('text/html').send(content)
    }

  },

  getSingleLayerTileJSON: async (req, reply, fastify) => {
    const { collectionId } = req.params;

    let vector_layers = globalThis.db
      .prepare(`
        SELECT *
        FROM sqlite_master m
        INNER JOIN vector_layers_statistics l ON m.name = l.table_name
        WHERE table_name=?;
      `)
      .all(collectionId)

    reply.send(format.tileJSON(vector_layers, collectionId))
  },

  getMultiLayerTileJSON: async (req, reply, fastify) => {

    let vector_layers = globalThis.db
      .prepare(`
        SELECT *
        FROM sqlite_master m
        INNER JOIN vector_layers_statistics l ON m.name = l.table_name;
      `)
      .all()

    reply.send(format.tileJSON(vector_layers))
  },

  getSingleLayerTile: async (req, reply, fastify) => {
    const SphericalMercator = require('@mapbox/sphericalmercator')
    const merc = new SphericalMercator({ size: 512 });

    const geojsonvt = require('geojson-vt')
    const vtpbf = require('vt-pbf')

    const { collectionId, x, y, z } = req.params;

    const bbox = merc.bbox(x, y, z)

    const layer = globalThis.db.prepare("SELECT table_name, geometry_column FROM vector_layers_statistics WHERE table_name=?").get(collectionId)

    const { table_name, geometry_column } = layer;

    const features = globalThis.db
      .prepare(`
        SELECT *, AsGeoJSON(${geometry_column},6) geojson FROM ${table_name} where intersects(${table_name}.${geometry_column},BuildMbr(${bbox.toString()})) AND
        ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = '${table_name}' and f_geometry_column = '${geometry_column}' AND search_frame = BuildMbr(${bbox.toString()}) 	) 
        LIMIT 1000
      `).all();

    if (features.length == 0) reply.code(404).send();

    const geojson = {
      type: "FeatureCollection",
      features: features.map(feature => format.geojson(feature)),
    };

    let tileIndex = geojsonvt(geojson, { maxZoom: 20 })
    let tile = tileIndex.getTile(parseInt(z), parseInt(x), parseInt(y))

    let Obj = {};
    Obj[table_name] = tile

    const pbf = vtpbf.fromGeojsonVt(Obj, { version: 2 })

    reply
      .header('Content-Type', 'application/vnd.vector-tile')
      .header('OATiles-hint', null) // OATiles-hint: at all more detailed zoom levels empty (no data) or OATiles-hint: full (same color all the way down)
      .send(Buffer.from(pbf))

  },

  getMultilayerTile: async (req, reply, fastify) => {
    const SphericalMercator = require('@mapbox/sphericalmercator')
    const merc = new SphericalMercator({ size: 512 });

    const geojsonvt = require('geojson-vt')
    const vtpbf = require('vt-pbf')

    const { x, y, z } = req.params;

    const bbox = merc.bbox(x, y, z)

    const vector_layers = globalThis.db.prepare("SELECT table_name, geometry_column FROM vector_layers_statistics").all();

    Obj = {};

    vector_layers.forEach(layer => {
      const { table_name, geometry_column } = layer;

      const features = globalThis.db
        .prepare(`
          SELECT *, AsGeoJSON(${geometry_column},6) geojson FROM ${table_name} where intersects(${table_name}.${geometry_column},BuildMbr(${bbox.toString()})) AND
          ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = '${table_name}' and f_geometry_column = '${geometry_column}' AND search_frame = BuildMbr(${bbox.toString()}) 	) 
          LIMIT 1000
        `).all();

      if (features.length == 0) return;

      const geojson = {
        type: "FeatureCollection",
        features: features.map(feature => format.geojson(feature)),
      };

      let tileIndex = geojsonvt(geojson, { maxZoom: 20 })
      let tile = tileIndex.getTile(parseInt(z), parseInt(x), parseInt(y))

      Obj[table_name] = tile
    })

    const pbf = vtpbf.fromGeojsonVt(Obj, { version: 2 })

    reply
      .header('Content-Type', 'application/vnd.vector-tile')
      .header('OATiles-hint', null) // OATiles-hint: at all more detailed zoom levels empty (no data) or OATiles-hint: full (same color all the way down)
      .send(Buffer.from(pbf))

  },

  getTileMatrixsets: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    const { f } = req.query;

    if (f == "json") reply.send(format.tileMatrixsets())
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/tilematrixsets.html', { locals: { baseurl: baseurl } })
      reply.type('text/html').send(content)
    }


  },

  getTileMatrix: async (req, reply, fastify) => {
    const { f } = req.query;

    if (f == "json") reply.send(format.tileMatrix())
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/tilematrixset.html', {})
      reply.type('text/html').send(content)
    }


  },

  getStyles: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    const { f } = req.query;

    const styles = globalThis.styles.find({ "collection": "" }).data || []
    const formattedStyles = format.styles(styles);
    if (f == "json") {
      reply.send(formattedStyles)
    }

    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/styles.html', { locals: { baseurl: baseurl, data: formattedStyles, collectionId: null } })

      reply.type('text/html').send(content)

    }
  },

  getCollectionStyles: async (req, reply, fastify) => {
    const { baseurl } = process.env;

    const { collectionId } = req.params;
    const { f } = req.query;

    const styles = globalThis.styles.find({ "collection": collectionId }) || []
    const formattedStyles = format.styles(styles);
    if (f == "json") {
      reply.send(formattedStyles)
    }

    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/styles.html', { locals: { baseurl: baseurl, data: formattedStyles, collectionId: collectionId } })

      reply.type('text/html').send(content)

    }
  },

  getStyle: async (req, reply, fastify) => {
    const { baseurl } = process.env;

    const { styleId } = req.params;
    const { f } = req.query;

    const style = globalThis.styles.findOne({ "id": styleId })?.style
    if (style == null) reply.code(404).send()
    else if (f == "mapbox") reply.send(style)
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/style.html', { locals: { baseurl: baseurl, style: style, collectionId: null } })

      reply.type('text/html').send(content)

    }
  },

  getCollectionStyle: async (req, reply, fastify) => {
    const { baseurl } = process.env;

    const { collectionId, styleId } = req.params;
    const { f } = req.query;

    const style = globalThis.styles.findOne({ "collection": collectionId, "id": styleId })?.style
    if (style == null) reply.code(404).send()
    else if (f == "mapbox") reply.send(style)
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/style.html', { locals: { baseurl: baseurl, collectionId: collectionId, styleId: styleId, style: style, } })

      reply.type('text/html').send(content)

    }
  },

  postStyle: async (req, reply, fastify) => {
    const style = req.body

    globalThis.styles.insert({ "id": style.name, "style": style })
    reply.code(201).send()
  },

  putStyle: async (req, reply, fastify) => {
    const { styleid } = req.params;

    const style = req.body

    globalThis.styles.findAndUpdate({ "id": styleid }, r => { r.style = style })
    reply.code(204).send()
  },

  deleteStyle: async (req, reply, fastify) => {
    const { styleid } = req.params;

    globalThis.styles.findAndRemove({ "id": styleid })
    reply.code(204).send()
  },

  getStyleMetadata: async (req, reply, fastify) => {
    const { styleid } = req.params;
    const style = globalThis.styles.findOne({ "id": styleid })

    if (style == null) reply.code(404).send()
    reply.send(format.styleMetadata(style))
  },

  getMapDesc: async (req, reply, fastify) => {
    let { f } = req.query;

    const styles = globalThis.styles.data || []

    if (f == "json") reply.send(format.mapDesc(styles))
    else {
      const es6Renderer = require('express-es6-template-engine');
      const content = await es6Renderer(__dirname + '/views/maps.html', { locals: { styles: styles } })
      reply.type('text/html').send(content)
    }

  },

  getMap: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    let { styleId } = req.params;

    let { f, bbox, width, height } = req.query;
    bbox = bbox ? bbox.split(",").map(e => Number(e)) : [-180, -90, 180, 90]

    if (f == "png" || f == "jpeg") {
      const page = await globalThis.browser.newPage();
      await page.setViewport({
        width: Number(width) || 800,
        height: Number(height) || 450
      })
      await page.goto(baseurl + '/map/' + styleId + '?f=html&bbox=' + bbox);

      await page.waitForFunction('window.ready == true');
      const element = await page.$('canvas');

      const image = await element.screenshot({
        omitBackground: true,
        type: f.split("/").pop()
      });
      await page.close();
      reply.type(f).send(image)
    }
    else {
      const style = globalThis.styles.findOne({ "id": styleId, "collection": "" })?.style
      const es6Renderer = require('express-es6-template-engine');

      const content = await es6Renderer(__dirname + '/views/map.html', { locals: { style: JSON.stringify(style), bbox: bbox } })
      reply.type('text/html').send(content)

    }

  },

  getCollectionMap: async (req, reply, fastify) => {
    const { baseurl } = process.env;
    let { collectionId, styleId } = req.params;

    let { f, bbox, width, height } = req.query;
    bbox = bbox ? bbox.split(",").map(e => Number(e)) : [-180, -90, 180, 90]

    if (f == "png" || f == "jpeg") {
      const page = await globalThis.browser.newPage();
      await page.setViewport({
        width: Number(width) || 800,
        height: Number(height) || 450
      })
      await page.goto(baseurl + '/collections/' + collectionId + '/styles/' + styleId + '/map?f=html&bbox=' + bbox);

      await page.waitForFunction('window.ready == true');
      const element = await page.$('canvas');

      const image = await element.screenshot({
        omitBackground: true,
        type: f.split("/").pop()
      });
      await page.close();
      reply.type(f).send(image)
    }
    else {
      if (styleId.includes(":")) {
        split = styleId.split(":");
        styleId = split[1]
        collectionId = split[0]
      }
      const style = globalThis.styles.findOne({ "id": styleId, "collection": collectionId })?.style
      const es6Renderer = require('express-es6-template-engine');


      const content = await es6Renderer(__dirname + '/views/map.html', { locals: { style: JSON.stringify(style), bbox: bbox } })
      reply.type('text/html').send(content)

    }

  },

  getFonts: async (req, reply, fastify) => {
    let { fontstack, range } = req.params;

    const stream = fs.createReadStream(`./resources/fonts/${fontstack}/${range}.pbf`, 'utf8')
    reply.send(stream)


    reply.type(f).send(image)

  }
}
