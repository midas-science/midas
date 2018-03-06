import Loader from './Loader';

// Utils
import fs from 'fs-extra';
import flatten from 'flat';
import {promisify} from 'util';

// XLSX handler
import XLSXWriter from 'xlsx-writestream';


class XLSXLoader extends Loader {

    constructor(config) {
    	super(config);
    }

    load(data) {
        let _data = [];

        data.forEach((row, index) => {
        	_data.push(flatten(row));
        });

        let writer = new XLSXWriter(this.config._target.path, {} /* options */);
        let writerPromise = promisify(XLSXWriter.write);
        writerPromise(this.config._target.path, _data);

		return Promise.resolve(true);
    }

}

export { XLSXLoader as default}