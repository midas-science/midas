// Utils
import fs from 'fs-extra';
import RecursiveIterator from 'recursive-iterator';
import camelCase from 'camelcase';
import TypeChecker from './../Utils/TypeChecker';

// Utils
import ArrayUtils from './../Utils/ArrayUtils';
import csvjson from 'csvjson';
import XLSX from 'xlsx';
import read_json_sync from 'read-json-sync';
import jp from 'jsonpath';

import inquirer from 'inquirer';
import colors from 'colors';
import prettyjson from 'prettyjson';


class Wizard {

	_transform_to_config_object(object) {
		let config = {source: {}, target:{}, enrichers:[]};

		// Source
		config.name = object.name;
		config.source[object.source_type] = {};
		config.source[object.source_type].path = object.source_path;

		// Enricher
		let enricher_name = this._has_custom_enricher(object) ? camelCase(object.custom_enricher) : camelCase(object.enricher);

		if(object.enricher !== 'no') {
			config.enrichers = [{
				name: enricher_name,
				path: this._resolve_enricher_parent_path(enricher_name),
				config: {
					input_parameter: object.source_object_path,
					target_property: object.target_property_name
				}
			}];
		} else {
			config.enrichers = [{
				name: "NAME_OF_YOUR_ENRICHER",
				path: "ABSOLUTE_PATH_TO_YOUR_ENRICHER",
				config: {
					input_parameter: object.source_object_path,
					target_property: object.target_property_name
				}
			}];
		}


		// Add configs for pre-defined enricher
		if(!this._has_custom_enricher(object) && enricher_name === 'openWeather') {
			config.enrichers[0].config['api_key'] = object.enricher_config_api_key;
		}

		// Target
		if(object.target_type === 'alter source') {
			config.target[object.source_type] = {};
			config.target[object.source_type].path = object.source_path;			
		} else {
			// ONLY TARGET FOR ALPHA
			config.target[object.source_type] = {};
			config.target[object.source_type].path = object.source_path;	

			//config.target[object.target_type] = {};
			//config.target[object.target_type].path = object.target_path;
		}		

		return config;
	}

	_has_custom_enricher(answers) {
		return typeof answers.custom_enricher !== 'undefined';
	}

	_resolve_enricher_parent_path(name) {
		let base_path = __dirname + '/../Enrichers/';
		if(name === 'openWeather') {
			return base_path;
		}
		return process.cwd();
	}

	_create_enricher(name) {
		name = camelCase(name);
		const enricher_template = `
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

  // eof class
};

module.exports.Enricher = Enricher;
		`;

		let new_enricher_source = enricher_template.replace(/Enricher/g, name);
		let enricher_path = process.cwd() + '/' + name + '.js';
		fs.writeFileSync(enricher_path, new_enricher_source);
		return enricher_path;
	}

	_process_answers(answers) {
		let config_object = this._transform_to_config_object(answers);
		let config_string = JSON.stringify(config_object, null, '\t');
		let config_save_path = process.cwd()+'/'+config_object.name.toLowerCase().replace(/\s/g, "_")+'_midas.json';

		if(this._has_custom_enricher(answers)) {
			 this._create_enricher(answers.custom_enricher);
		}

		let config_save_state = fs.outputJson(config_save_path, config_object, {spaces:'\t'});
		config_save_state.then(() => {
			console.log('');
  			console.log('--------------------------------------------------------------');
  			console.log('✅ New enrichment job successfully created '.green.bold);
  			console.log('');
  			console.log(' ⚠️ You can freely customize your enrichment job using your own enrichers and config'.cyan);
  			console.log('Check out https://midas.science/guide'.cyan);
			console.log('');

			// Notify user that s/he has to add an enricher themself
			if(!this._has_custom_enricher(answers)) {
				console.log('');
				console.log(' ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
				console.log('Currently you didn\'t specify any enricher for your process'.bold);
				console.log('Create or add one before start your enrichement process'.bold);
				console.log(' ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
				console.log('');
				console.log('');
			}

  			console.log('Start enrichment process via '.green.bold);
  			console.log('midas enrich -c "'+config_save_path+'"');
  			console.log('--------------------------------------------------------------');
  			console.log('');				
		}).catch((err) => console.log('Something went wrong'));
	}

	start() {

		let questions = inquirer
		  .prompt([
			{
			    type: 'input',
			    name: 'name',
			    message: "Chose a name for your enrichment process:",
			  },
	      	{
			    type: 'list',
			    name: 'source_type',
			    message: 'What\'s your data source?',
			    choices: ['CSV', 'JSON', 'XLSX'],
			    filter: function(val) {
			      return val.toLowerCase();
			    }
		    },
			{	
				when: function(response) {
					return response.source_type === 'csv';
				},
			    type: 'input',
			    name: 'csv_delimiter',
			    message: "What\'s the delimiter of your CSV file?",
			  },
			{
				when: function(response) {
					return true;
				},
				type: 'input',
				name: 'source_path',
				message: "Where is your file located? (Enter the absolute path)",
				validate: function(value) {
					if (fs.existsSync(value)) {
					    return true;
					}
						return 'File not found :/';
					}
			},
			{
				when: function(response) {
					return true;
				},
				type: 'input',
				name: 'source_object_path',
				message: function(response) {
					if(response.json_path_validate === 'n') {
						return 'Just try again';
					}
					else {
						return 'JSON Path';
					}
				},
				validate: function(value, response) {

					
					// Extract data schema
			    	let data_set = null;
			    	if(response.source_type === 'xlsx') {
						let wb = XLSX.readFile(response.source_path, {type: "file"});
		    			data_set = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {raw:false, header:1});
		    			data_set = ArrayUtils.arrayObjectify(data_set);
		    		} else if(response.source_type === 'csv') {

				        let options = {
				          delimiter : response.csv_delimiter,
				          quote     : '"'
				        };

		    			let _data = fs.readFileSync(response.source_path, { encoding : 'utf8'});
		    			data_set = csvjson.toObject(_data, options);
		    		} else if(response.source_type === 'json') {
		    			data_set = read_json_sync(response.source_path);
		    		}

		    		let jp_source_data = null;

		    		try {
		    			jp_source_data = jp.nodes(data_set, value);
		    		} catch(e) {
		    			return 'Please enter a valid json path';
		    		}

		    		let example_data_point = 'Not found';		    		
		    		if(jp_source_data.length > 0 && typeof jp_source_data[0].value !== 'undefined') {
		    			example_data_point = jp_source_data[0].value;
		    		} else {
		    			return 'Please enter a valid json path';
		    		}

		    		let example_data_point_type = (typeof example_data_point).bold;
		    		if(Array.isArray(example_data_point)) {
		    			example_data_point_type = 'array'.bold;
		    		}
		    		
		    		console.log('');
		    		console.log('');
		    		console.log('This will be the input for your enricher:');
		    		console.log('Example (first row / data point):');
		    		console.log('');
		    		console.log('Type ' + example_data_point_type);
		    		if(typeof example_data_point === 'object') {
		    			console.log(prettyjson.render(example_data_point));
		    		} else {
		    			console.log(example_data_point.blue);
		    		}	
		    		console.log('');
		    		console.log('');


					return true;
				}
			},    

	      	{
			    type: 'list',
			    name: 'enricher',
			    message: 'Do you want to create a new enricher?',
			    choices: ['Yes', 'No'],
			    filter: function(val) {
			      let return_value = val;
			      if(val === 'Yes') {
			      	return_value = 'custom';
			      }
			      return camelCase(return_value);
			    }
		    },

	      	{
	      		when: function(response) {
					return response.enricher === 'custom';
	      		},
			    type: 'input',
			    name: 'custom_enricher',
			    message: 'Specify a name for your new enricher',
			    filter: function(val) {
			      return val;
			    }
		    },

			{
	      		when: function(response) {
					return true;
	      		},
			    type: 'input',
			    name: 'target_property_name',
			    message: "Name of the enriched property?"
			},

		]);
  	

  		questions.then(answers => {
  				this._process_answers(answers);
  			}
  		);
		// eof
	}

}

export { Wizard as default }