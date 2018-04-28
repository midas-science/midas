import Extractor from './Extractor';

const SqlString = require('sqlstring');
const mysql = require('mysql2/promise');

// MySQL handler

class MySQLExtractor extends Extractor {

    constructor(config) {
    	super(config);
    }

    get_data_sync() {
    	return read_json_sync(this.config._source.path);
    }

    async get_data_promise() {
    		
		const db_config = {
			host:this.config._source.host,
			port:this.config._source.port,
			user:this.config._source.user,
			password:this.config._source.password,
			database:this.config._source.database
		};

		// create the connection
		const connection = await mysql.createConnection(db_config);

		// query database
		const [rows, fields] = await connection.execute(`SELECT * FROM ${SqlString.escapeId(this.config._source.table)}`);

		// close connection after query
		connection.close();

		return rows;
    }

}

export { MySQLExtractor as default}