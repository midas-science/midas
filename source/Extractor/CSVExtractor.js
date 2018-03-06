import Extractor from './Extractor';

import fs from 'fs-extra';

// CSV Extractors
import csvjson from 'csvjson';


class CSVExtractor extends Extractor {

    constructor(config) {
    	super(config);
    }

    get_data_sync() {
        // NOT YET IMPLEMENTED
    }

    get_data_promise() {
        let options = {
          delimiter : ',',
          quote     : '"'
        };
        let data = fs.readFile(this.config._source.path, { encoding : 'utf8'});
        return data.then((data) => {
            return Promise.resolve(csvjson.toObject(data, options));
        });
    }

}

export { CSVExtractor as default}