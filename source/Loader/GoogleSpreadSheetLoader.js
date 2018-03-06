import Loader from './Loader';

// JSON
import fs from 'fs-extra';

// Utils
import {promisify} from 'util';

// GoogleSpreadSpreadsheet handler
import GoogleSpreadSheet from 'google-spreadsheet';

class GoogleSpreadSheetLoader extends Loader {

    constructor(config) {
    	super(config);
    }

    _get_header_keys(data) {
    	if(!Array.isArray(data)) {
    		return Object.keys(data);
    	} else {
    		return Object.keys(data[0]);
    	}
    }

    load(data) {

		let doc = new GoogleSpreadSheet(this.config._target.spreadsheet_id);
		let creds = require(this.config._target.credentials_file_path);

		let doc_promise = {};
		doc_promise.useServiceAccountAuth = promisify(doc.useServiceAccountAuth);
		doc_promise.getRows = promisify(doc.getRows);
		doc_promise.getCells = promisify(doc.getCells);
		doc_promise.addWorksheet = promisify(doc.addWorksheet);

        data.forEach((row) => {
        	row.street = row.company_address.street;
        	row.lng = row.company_address.lng;
        	row.lat = row.company_address.lat;
        	row.save();
        });

        return Promise.resolve('Done');
    }

}

export { GoogleSpreadSheetLoader as default}