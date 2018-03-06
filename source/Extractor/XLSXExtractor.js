import Extractor from './Extractor';

// Utils
import ArrayUtils from './../Utils/ArrayUtils';

// XLSX handler
import XLSX from 'xlsx';

class XLSXExtractor extends Extractor {

    constructor(config) {
    	super(config);
    }

    get_data_promise() {
	   	let wb = XLSX.readFile(this.config._source.path, {type: "file"});
    	let sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {raw:false, header:1});
    	let objects = ArrayUtils.arrayObjectify(sheet);
    	return Promise.resolve(objects);
    }

}

export { XLSXExtractor as default}