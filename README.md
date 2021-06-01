<div align=center>

![](.readme/logo.png)
# KORT XYZ 
</div>

## About The Project
POC made for  [OGCAPI codesprint 2021-05](https://github.com/opengeospatial/ogcapi-code-sprint-2021-05)
Its an [Node.js®](https://nodejs.org/en/) implemention of the standards made using an [Fastify](https://www.fastify.io/)-based application that autogenerates the routes from a [OpenAPI](https://swagger.io/specification/) schema. 
Data is a [Spatialite](https://www.gaia-gis.it/fossil/libspatialite/index) file containing geodata in [EPSG:4326](https://spatialreference.org/ref/epsg/wgs-84/)

![](.readme/OGCAPI1.gif)
![](.readme/OGCAPI2.gif)
![](.readme/OGCAPI3.gif)

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

####  Run from the exe file 
* get a copy on the realease from [release](https://github.com/KORTxyz/ogcapi-spatialite/releases/download/0.1.3/0.1.3.zip)
* Unpack to a folder
* Create a .env file (or set the manually) containing:
```sh
    baseurl = "http://127.0.0.1:5555"
    port = 5555
    database = 'D:\test\data.sqlite'
    title = "OGCAPI - Codesprint" 
    description = "POC on a Nodejs implementation"
```
* run the exe file
#### Run local nodejs
* Create a .env file (or set the manually) containing:
```sh
    baseurl = "http://127.0.0.1:5555"
    port = 5555
    database = 'D:\test\data.sqlite'
    title = "OGCAPI - Codesprint" 
    description = "POC on a Nodejs implementation"
```
*  ``` npm start```


<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/github_username/repo_name/issues) for a list of proposed features (and known issues).


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

