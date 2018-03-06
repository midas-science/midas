import json_loader from 'load-json-file';
import read_json_sync from 'read-json-sync';


class Config {
    constructor(json) {
        this.json = json;
    }    

    get_config_object_promise() {
    	return json_loader(this.json);
    }

    get_config_object_sync() {
    	let config = read_json_sync(this.json);

    	// Sanity check 
    	// Make source = target if no target is defined
    	if(typeof config.target === 'undefined') {
    		config.target = config.source;
    	}

        return config;
    }

}

export { Config as default}