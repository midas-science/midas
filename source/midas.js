// Utils
import ClassLoader from './Utils/ClassLoader';
import ArrayUtils from './Utils/ArrayUtils';
import object_path from 'object-path';
import colors from 'colors';
import RecursiveIterator from 'recursive-iterator';
import jp from 'jsonpath';
import RateLimiter from './Utils/RateLimiter';

// Extractors
import JSONExtractor from './Extractor/JSONExtractor';
import CSVExtractor from './Extractor/CSVExtractor';
import XLSXExtractor from './Extractor/XLSXExtractor';
import GoogleSpreadSheetExtractor from './Extractor/GoogleSpreadSheetExtractor';
import MySQLExtractor from './Extractor/MySQLExtractor';

// Loaders
import JSONLoader from './Loader/JSONLoader';
import CSVLoader from './Loader/CSVLoader';
import XLSXLoader from './Loader/XLSXLoader';
import MySQLLoader from './Loader/MySQLLoader';
// import GoogleSpreadSheetLoader from './Loader/GoogleSpreadSheetLoader';


class Midas {

    constructor(config) {
        this.config = config;  
        this.config._source = this.config.source[Object.keys(this.config.source)[0]];
        this.config._source.type = Object.keys(this.config.source)[0];
        this.config._target = this.config.target[Object.keys(this.config.target)[0]];
        this.config._target.type = Object.keys(this.config.target)[0];
        this.rp = null;
    }

    _report_status(status) {
        console.log(status.message);
    }

    _chain_enrichers(enrichers, data) {
        var self = this;
        async function chain_enricher_promises(promises, self) {
            var result = [];
            let enrichment_target = null;
            let intermediate_result = null;
            let path_expression = '';
            let parent_object_path = '';
            let parent = {};

            for (let promise of promises) {

                let jp_source_data = jp.nodes(data, promise.getConfig().input_parameter);
                let enriched_property_name = promise.getConfig().target_property;
                for(let node of jp_source_data) {

                    let node_path = node.path.join('.').substring(2); // Remove leading $. from path string for object path 
                    enrichment_target = node.value;
                    
                    promise.setData(enrichment_target);  
                    intermediate_result = enrichment_target;
                    intermediate_result = await promise.process(intermediate_result);
                    let deep_copied_intermediate_result = JSON.parse(JSON.stringify(intermediate_result));

                    // Check node type 
                    if(typeof node.value !== 'object' && !Array.isArray(node.value)) {
                        path_expression = jp.stringify(node.path);
                        let node_path_deep_copy = JSON.parse(JSON.stringify(node.path));
                        //node_path_deep_copy.pop();
                        node_path_deep_copy.shift();
                        parent_object_path = node_path_deep_copy.join('.');

                        // get parent and check if it's an array
                        parent = jp.parent(data, path_expression);
                        if(Array.isArray(parent)) {
                            let enriched_intermediate_object = {value: node.value};
                            enriched_intermediate_object[enriched_property_name] = deep_copied_intermediate_result;
                            object_path.set(data, parent_object_path, enriched_intermediate_object);
                        } else {
                            parent[enriched_property_name] = deep_copied_intermediate_result;
                        }
                    }
                                       
                    if(typeof node.value === 'object' && !Array.isArray(node.value)) {
                        object_path.set(data, node_path + '.' + enriched_property_name, deep_copied_intermediate_result);
                     }

                    if(Array.isArray(node.value)) {
                        path_expression = jp.stringify(node.path);
                        parent = jp.parent(data, path_expression);
                        parent[enriched_property_name] = deep_copied_intermediate_result;
                    }

                    // check if there is some kind of rate limit defined within the configuration
                    if(typeof promise.getConfig().rate_limit !== 'undefined' && typeof promise.getConfig().rate_limit !== 'undefined') {
                        await RateLimiter.async_stall(promise.getConfig().rate_limit.number_of_requests, promise.getConfig().rate_limit.time_window);
                    }
                }
            
            }

            return {data: result};
        }
        return chain_enricher_promises(enrichers, self);
    }

    _instantiate_enricher_classes(enrichers, enricher_classes, data) {
        let instances = [];
        enrichers.forEach((enricher, index) => {
            instances.push(new enricher_classes[index][enricher.name](this._enricher_add_utils(), data, enrichers[index].config));
        });
        return instances;
    }

    _enricher_add_utils() {
        let rp = require('request-promise');
        return rp;
    }

    _extractor() {
        let extractor_type = this.config._source.type.toLowerCase();

        if(extractor_type === 'json') {
            return new JSONExtractor(this.config);
        }

        if(extractor_type === 'csv') {
            return new CSVExtractor(this.config);
        }

        if(extractor_type === 'xlsx') {
            return new XLSXExtractor(this.config);
        }

        if(extractor_type === 'googlespreadsheet') {
            return new GoogleSpreadSheetExtractor(this.config);
        }

        if(extractor_type === 'mysql') {
            return new MySQLExtractor(this.config);
        }

    }

    _loader() {
        let loader_type = this.config._target.type.toLowerCase();

        if(loader_type === 'json') {
            return new JSONLoader(this.config);
        }

        if(loader_type === 'csv') {
            return new CSVLoader(this.config);
        }

        if(loader_type == 'xlsx') {
            return new XLSXLoader(this.config);
        }

        if(loader_type == 'mysql') {
            return new MySQLLoader(this.config);
        }

    }

    _extract_data() {
        return this._extractor().get_data_promise();
    };

    _match_path(path_generic, path_instance) {
        let path_generic_split = path_generic.split('.');
        let path_instance_split = path_instance.split('.');

        var isNumber = function(val) {
            return /^\d+$/.test(val);
        }

        // Remove starting $.
        path_generic_split.shift();


        // Compare paths
        let result = true;
        path_generic_split.forEach((path_element, index) => {
            if(path_element === '[:]') {
                if(!isNumber(path_instance_split[index])) {
                    result = false;
                }
            } else {
                result = result && (path_instance_split[index] === path_element) && (path_generic_split.length == path_instance_split.length);
            }
        });

        return result;
    }

    // TODO
    stream_touch() {
        // get the client
        const mysql = require('mysql2');

        // create the connection to database
        const conn = mysql.createConnection({
          host: 'localhost',
          user: 'root',
          database: 'midas'
        });

        let statement = 'SELECT * FROM p42a202ef3eec7cc7bc956653f7335a4';


        var keepProcessing = true;

        const done = () => {
           keepProcessing  = true;
           conn.close()
        }

        const query = conn.query(statement)
            .on('result', (aRow)=>{
                if (!keepProcessing) {
                  return; 
                }
                if (false) {
                   done()          
                }
                console.log(aRow);
            })
            .on('end', ()=>{
                done()
            })
            .on('error', err => {
                if (!err.isFatal) {
                   // not a disconnect - logic error like sql syntax etc
                  done();
                 }
                 // for disconnects pool should handle error and remove connection from pool, no need to release()
             })



        console.log('stream touch');
    }

    touch_lol() {
        let data_promise = this._extract_data();
        data_promise.then((data) => {
            console.log(data);
        })
    }

    touch() {

        // LOG
        this._report_status({message: '👑👑 midas data enrichment process started'.yellow.bold});
        this._report_status({message: this.config.name + ' || ' + this._extractor().get_type() + '->' + this._loader().get_type() + '\n'});

        let data_promise = this._extract_data();

        // TODO: Fix hardcoded path
        let enricher_classes = ClassLoader.load_classes(this.config.enrichers);
        let enrichers = this._instantiate_enricher_classes(this.config.enrichers, enricher_classes, {});      

        // LOG
        this._report_status({message: '🔗🔗 Enrichment chain'.bold + ''});
        let status_message = '';
        this.config.enrichers.forEach((enricher, index) => {
            if(index < (this.config.enrichers.length - 1)) {
                status_message += enricher.name + ' -> ';
            } else {
                status_message += enricher.name;
            }            
        });
        status_message = status_message.split(' -> ').join(' -> ');
        this._report_status({message: status_message});           


        data_promise.then((data_set) => {

            data_set = ArrayUtils.arrayify(data_set);
            let enrichers_chain = [];
            let enrichment = enrichers_chain.push(this._chain_enrichers(enrichers, data_set));  

            Promise.all(enrichers_chain)
            .then(enriched_items => {

                let result = this._loader().load(data_set);
                result.then((res) => {
                    // LOG
                    this._report_status({message: '\n✅ midas data enrichment process done'.green.bold});
                });
            }).catch((err) => {
                console.log(err);
                console.log('Something went wrong'.red);
            }); 
        });
        // end of function
    }

}

export { Midas as default}