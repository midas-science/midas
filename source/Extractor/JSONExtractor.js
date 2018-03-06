import Extractor from './Extractor';

// JSON handlers
import json_loader from 'load-json-file';
import read_json_sync from 'read-json-sync';

class JSONExtractor extends Extractor {

    constructor(config) {
    	super(config);
    }

    get_data_sync() {
    	return read_json_sync(this.config._source.path);
    }

    get_data_promise() {
    	return json_loader(this.config._source.path);
    }

}

export { JSONExtractor as default}