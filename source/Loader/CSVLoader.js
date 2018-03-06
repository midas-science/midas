import Loader from './Loader';
import fs from 'fs-extra';

import flatten from 'flat';
import csvjson from 'csvjson';


class CSVLoader extends Loader {

    constructor(config) {
    	super(config);
    }

    load(data) {
		let options = {
		    delimiter   : this.config._target.delimiter,
		    wrap        : false,
            headers     : 'key'
		};

        let _data = [];

        data.forEach((row, index) => {
            _data.push(flatten(row));
        });

    	var data_string = csvjson.toCSV(_data, options);
        return fs.outputFile(this.config._target.path, data_string);
    }

}

export { CSVLoader as default}