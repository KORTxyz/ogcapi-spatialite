require('dotenv').config()


const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const Database = require('better-sqlite3');
const loki = require('lokijs')

if(!process.env.database) {
  console.error("ERROR! database parameter not present in enviroment") 
  process.exit()
}

globalThis.db = new Database(process.env.database);
globalThis.db.loadExtension( './mod_spatialite');

require('./init').styles();
require('./init').puppeteer();



const fastify = require('fastify')({
  ignoreTrailingSlash: true,
  caseSensitive: false,
  logger: {
    level: 'info',
    file: 'log' // Will use pino.destination()
  }
});

const spec = yaml.load(fs.readFileSync('./schema.yaml', 'utf8'));
const handler = require('./handlers');

fastify.register(require('./plugins/oas3-fastify'), { spec, handler })

fastify.register(require('fastify-swagger'), {
  routePrefix: '/api',
  exposeRoute: true,
  mode: 'static',
  specification: {
    path: './schema.yaml',
  }
})


fastify.register(require('fastify-cors'));
if(process.env.NODE_ENV == 'production') fastify.register(require('fastify-caching'),{ expiresIn:3600 });


fastify.listen(process.env.port||1234, function (err, address) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  


  console.info(`Server listening on ${address}`)
})

