import Extractor from './Extractor';

// Utils
import ArrayUtils from './../Utils/ArrayUtils';
import {promisify} from 'util';

// GoogleSpreadSpreadsheet handler
import GoogleSpreadSheet from 'google-spreadsheet';


class GoogleSpreadSheetExtractor extends Extractor {

    constructor(config) {
    	super(config);
    }

    get_data_promise() {
		let doc = new GoogleSpreadSheet(this.config._source.spreadsheet_id);
		let creds = require(this.config._source.credentials_file_path);

		let doc_promise = {};
		doc_promise.useServiceAccountAuth = promisify(doc.useServiceAccountAuth);
		doc_promise.getRows = promisify(doc.getRows);

		return doc_promise.useServiceAccountAuth(creds).then(() => {
			return doc_promise.getRows(1).then((rows, err) => {
				return Promise.resolve(rows);
			});
		});
    }

}

export { GoogleSpreadSheetExtractor as default}