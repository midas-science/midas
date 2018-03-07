![version](https://i.imgur.com/i7MPZvF.png)

![npm](https://img.shields.io/npm/v/npm.svg?style=for-the-badge)
![version](https://img.shields.io/badge/version-0.1-blue.svg?Cache=true&style=for-the-badge)

**midas** is a data enrichment platform that takes away the pain from enriching CSV, JSON and Excel files.

#### Navigation
* Website: [https://midas.science](https://www.midas.science)
* [How it works](#howitworks)
* [Getting started](#gettingstarted)
* [Pipeline Definition](#pipedef)
* [Enricher](#enrichers)
* [Examples](#examples)

<a name="howitworks"></a>
### How it works
![Image](https://i.imgur.com/PXYJAee.png)

**midas** makes it easy to enrich CSV, XLSX and JSON files with data from any API. The enrichment pipeline consists of 3 simple steps:

1. Give your pipeline a name, e.g. _WeatherEnrichment_
2. Define your source file, e.g. _Cities.xlsx_
3. Create an enricher for the API you want to use (see "Getting Started")
4. (optional) Define your target file, e.g. _CitiesWithWeatherEnriched.xlsx_

The extraction and parsing of the data, the handling of the individual API requests, the format conversion, e.g. from XLSX to JSON, as well as the loading of the data into your target is all handled by **midas**.

<a name="gettingstarted"></a>
### Getting started

1. Install the `midas` cli via `npm install -g midas-core`

2. Initialize a new enrichment pipeline via `midas init`

3. Follow the wizard 🧙 to create a new pipeline.  	
 	1. Give your pipeline a name, e.g. WeatherEnrichment
	2. Define the type of your source file (json, csv or xlsx)
	3. Tell midas where to find your source file. You should **use the absolute path** to the file here.
	4. Define the input parameter from your source that you want to the enricher to use via JSONPath. All data that matches your JSON path expression will be passed to the enricher. See http://goessner.net/articles/JsonPath/ for more information.
	5. (optional) Create a new enricher. An enricher in midas is a JavaScript class that contains the logic to call an external data source. Each enricher must contain a `process(inputData)` method where `inputData` will be a single data point from your source file that you specified earlier via JSON path. Within the enricher class you have access to request-promise via `this.rp` to make API calls. `process(inputData)` must always return a Promise. Just take a look at our examples.
	6. Chose a name for target property. The result of the Enricher `process()` call will be written here.
	
5. Start your pipeline via `midas enrich -c "{pipeline_name}_midas.json"`

```javascript
"use strict";
var Enricher = class Enricher {
  //...
  
  process(inputData) {

    if (typeof inputData !== 'undefined' && inputData != null) {
      this.inputData = inputData;
    }
    // Do stuff here


    return Promise.resolve(this.inputData);    
  }
};

module.exports.Enricher = Enricher;
```
<a name="pipedef"></a>
### Pipeline Definition

In midas, a pipeline definition is a JSON file containing the name of the pipeline, a source, an optional target and an array of enrichers. 

```json
{
	"name": "PIPELINE_NAME",
	"source": {
		"json": {
			"path": "ABSOLUTE_PATH_TO_SOURCE_FILE/transactions.json"
		}
	},
	"target": {
		"json": {
			"path": "ABSOLUTE_PATH_TO_TARGET_FILE/transactions.json"
		}
	},
	"enrichers": [
		{
			"name": "NAME_OF_YOUR_ENRICHER",
			"path": "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
			"config": {
				"input_parameter": "JSON_PATH_EXPRESSION",
				"target_property": "TARGET_PROPERTY_NAME"
			}
		}
	]	
}
```

#### Name
The name of the enrichment pipeline. This can be anything describtive.

```json
"name": "PIPELINE_NAME"
```



#### Source
The source specifies the file that you want to enrich. Currently, midas supports CSV, JSON and XSLX files.

###### JSON

```json
	"source": {
        "json": {
            "path": "ABSOLUTE_PATH_TO_SOURCE_FILE.json"
        }
    }
```

###### CSV

```json
     "source": {
        "csv": {
            "path": "ABSOLUTE_PATH_TO_SOURCE_FILE.csv"
        }
    }
```

###### XLSX

```json
     "source": {
        "xlsx": {
            "path": "ABSOLUTE_PATH_TO_SOURCE_FILE.xlsx"
        }
    }
```

#### Target (optional)
The target is useful if you want to convert your source file into another format. If no target is specified, the target will be equal to the source. The notation is exactly the same as for the source.

###### JSON

```json
     "target": {
        "json": {
            "path": "ABSOLUTE_PATH_TO_TARGET_FILE.json"
        }
    }
```

###### CSV

```json
     "target": {
        "csv": {
            "path": "ABSOLUTE_PATH_TO_TARGET_FILE.json"
        }
    }
```

###### XLSX

```json
     "target": {
        "xlsx": {
            "path": "ABSOLUTE_PATH_TO_TARGET_FILE.xlsx"
        }
    }
```
<a name="enrichers"></a>
#### Enrichers
Enrichers are JavaScript classes that are responsible for sending data to an external data source, transforming it and and passing it back to the midas core.

```json
	"enrichers": [
		{
			"name": "NAME_OF_YOUR_ENRICHER",
			"path": "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
			"config": {
				"input_parameter": "JSON_PATH_EXPRESSION",
				"target_property": "TARGET_PROPERTY_NAME"
			}
		}
	]
```	

Each enricher requires a name (must be equal to it's filename), a path to it and a configuration that specifies the input parameter from the source and the property name of the target.

###### Additional Configuration (API Keys etc.)
Often, APIs require keys to authenticate and authorize requests. The config property of the enricher definition can be used to pass such data. 
For example:

```json
	"enrichers": [
		{
			"name": "NAME_OF_YOUR_ENRICHER",
			"path": "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
			"config": {
				"input_parameter": "JSON_PATH_EXPRESSION",
				"target_property": "TARGET_PROPERTY_NAME",
				"api_key": "MY_API_KEY"
			}
		}
	]
```	

###### Chaining
It is possible to chain multiple enrichers by passing them in an array.

```json
	"enrichers": [
		{
			"name": "NAME_OF_YOUR_ENRICHER_1",
			"path": "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
			"config": {
				"input_parameter": "JSON_PATH_EXPRESSION",
				"target_property": "TARGET_PROPERTY_NAME",
				"api_key": "MY_API_KEY"
			}
		},
		{
			"name": "NAME_OF_YOUR_ENRICHER_2",
			"path": "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
			"config": {
				"input_parameter": "JSON_PATH_EXPRESSION",
				"target_property": "TARGET_PROPERTY_NAME",
				"api_key": "MY_API_KEY"
			}
		}
	]
```	

#### Creating a new enricher

Any midas enricher is a JavaScript class wich is responsible for taking the input data from the source file, sending it to an external data source and returning the result as a Promise. The following code skeleton shows how such an enricher class is structured. 

```javascript
"use strict";
var Enricher = class Enricher {

  constructor(rp, inputData, config) {
    //npm request-promise is used for handling requests
    //see: https://github.com/request/request-promise
    this.rp = rp;
    //loads inputData of the target file specified in the source object path in your config
    this.inputData = inputData;
    //loads config for this enrichment
    this.config = config;
  }

  getConfig() {
    return this.config;
  }

  getName() {
    return 'Enricher';
  }

  setData(inputData) {
    this.inputData = inputData;
  }

  process(inputData) {

    if (typeof inputData != 'undefined' && inputData != null) {
      this.inputData = inputData;
    }

    // Do stuff here


    return Promise.resolve(this.inputData);    
  }
};

module.exports.Enricher = Enricher;
```	

###### Call an API
Calling an API is by default done via request-promise (you can use any other way though). Let's check the following example where we use the Fixer.io API to enrich a file with currency exchange rates.

```javascript
"use strict";
var Enricher = class Enricher {

  constructor(rp, inputData, config) {
    //npm request-promise is used for handling requests
    //see: https://github.com/request/request-promise
    this.rp = rp;
    //loads inputData of the target file specified in the source object path in your config
    this.inputData = inputData;
    //loads config for this enrichment
    this.config = config;
  }

  getConfig() {
    return this.config;
  }

  getName() {
    return 'Enricher';
  }

  setData(inputData) {
    this.inputData = inputData;
  }

  process(inputData) {
	
   if (typeof inputData !== 'undefined' && inputData != null) {
       this.inputData = inputData;
   }
   
   //https://api.fixer.io/latest
   let req_url = 'https://api.fixer.io/latest';
   let options = {
       uri: req_url,
       qs: {
           base: this.inputData,
       },
       headers: {
           'User-Agent': 'midas'
       },
       json: true // Automatically parses the JSON string in the response
   };
   
   return this.rp(options).then((result) => {
       let _result = [];
       //console.log(result);
       try {
           _result = result.rates;
       } catch (e) {
           _result = null
       }
	        //console.log(typeof _result);
	        return Promise.resolve(_result);
   }).catch((err) => {
       return Promise.resolve('ERROR HAPPENED');
   });
   
}
};

module.exports.Enricher = Enricher;
```
<a name="#examples"></a>
#### Examples
You can find examples in the [midas repository](https://github.com/midas-science). 

Let's assume that we have a CSV file that contains a number of IP addresses and we want to find the corresponding geo locations to the IPs

###### Base CSV file

| ip_address      |
|-----------------|
| 132.66.7.104    |
| 125.161.131.190 |

###### Create enricher
First we have to create an new enricher which calls the API of [ipapi.co](https://ipapi.co/api/#location-of-a-specific-ip).
Therefore, we create a new file called `Ipapi.js` and adapt the `process()` method to call the right API.

```javascript
"use strict";
var Ipapi = class Ipapi {

    constructor(rp, inputData, config) {
        //npm request-promise is used for handling requests
        //see: https://github.com/request/request-promise
        this.rp = rp;
        //loads inputData of the target file specified in the source object path in your config
        this.inputData = inputData;
        //loads config for this enrichment
        this.config = config;
    }

    getConfig() {
        return this.config;
    }

    getName() {
        return 'Ipapi';
    }

    setData(inputData) {
        this.inputData = inputData;
    }

    process(inputData) {

        if (typeof inputData !== 'undefined' && inputData != null) {
            this.inputData = inputData;
        }

        /* ipapi REST API 
        https://ipapi.co/api/
        Endpoint
        GET https://ipapi.co/{ip}/{format}/
     
        */

        let req_url = 'https://ipapi.co/' + this.inputData +'/json/';
        let options = {
            uri: req_url,
            headers: {
                'User-Agent': 'midas'
            },
            json: true // Automatically parses the JSON string in the response
        };

        return this.rp(options).then((result) => {
            let _result = [];

            try {
                delete result.ip;
                _result = result;
            } catch (e) {
                _result = null
            }

            return Promise.resolve(_result);
        }).catch((err) => {

            return Promise.resolve('ERROR HAPPENED');
        });

    }
};

module.exports.Ipapi = Ipapi;
```

###### Create an enrichment pipeline configuration
In the next step, we create a new enrichment pipeline either by hand or by using the midas wizard. Based on our input CSV file and the enricher stated above, we create the following enrichment pipeline configuration:

```json
{
	"source": {
		"csv": {
			"path": "YOUR_PATH/enricher-ipapi/examples/ip-addresses.csv"
		}
	},
	"target": {
		"csv": {
			"path": "YOUR_PATH/enricher-ipapi/examples/ip-addresses_enriched.csv"
		}
	},
	"enrichers": [
		{
			"name": "Ipapi",
			"path": "YOUR_PATH/enricher-ipapi",
			"config": {
				"input_parameter": "$.*.ip_address",
				"target_property": "location"
			}
		}
	],
	"name": "ipapi enrichment"
}
```

That's it! Just start midas by using `midas enrich -c "PATH_TO_THE_CONFIGURATION"`

###### Result

| ip_address      | city    | ... |
|-----------------|---------|-----|
| 132.66.7.104    | Ramat   | ... |
| 125.161.131.190 | Jakarta | ... |
