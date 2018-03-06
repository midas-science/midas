import Loader from './Loader';

// JSON
import fs from 'fs-extra';

class JSONLoader extends Loader {

    constructor(config) {
    	super(config);
    }

    load(data) {
        return fs.outputJson(this.config._target.path, data, {spaces:'\t'});
    }

}

export { JSONLoader as default}