import Loader from './Loader';
import flat from 'flat';
import SqlString from 'sqlstring';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

import csvjson from 'csvjson';
import fs from 'fs-extra';
import path from 'path';

class MySQLLoader extends Loader {

    constructor(config) {
    	super(config);
    	this.db_config = {
    		connectionLimit: 10,
			host:this.config._target.host,
			port:this.config._target.port,
			user:this.config._target.user,
			password:this.config._target.password,
			database:this.config._target.database
		};
		this.pool = mysql.createPool(this.db_config);    	
    }

    async _get_connection() {
		return this.pool.getConnection();
    }

    _escape_column_name(name) {
    	return SqlString.escape(name.trim().toLowerCase().replace(/ /g, '_').replace(/'/g, '')).replace(/'/g, '');
    }

    async _create_columns(table_name, columns) {
    	table_name = SqlString.escapeId(table_name);
    	let connection = await this._get_connection();

    	// build statement
    	let statement = `ALTER TABLE ${table_name}`;
    	columns.forEach((column, index) => {
    		column = this._escape_column_name(column);
    		statement += `ADD COLUMN \`${column}\` varchar(255),`;
    	})
    	statement = statement.slice(0, -1);

    	let result = await connection.query(statement);
    	connection.close();
    	return result;
    }

    async _get_column_names_from_table(database, table_name) {
    	database = SqlString.escape(database);
    	table_name = SqlString.escape(table_name);
    	let result = [];

    	let connection = await this._get_connection();

		let column_statement = `SELECT \`COLUMN_NAME\`
		FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\`
		WHERE \`TABLE_SCHEMA\`= ${database}
		AND \`TABLE_NAME\`= ${table_name}`;  

		let existence_statement = `SELECT EXISTS (${column_statement})`;
		let table_exists = await connection.query(existence_statement);

		// looks weird but works
		table_exists = !! + table_exists[0][0][Object.keys(table_exists[0][0])[0]];

		// Return empty result if table does not exist
		if(!table_exists) {
			connection.close();
			return result;
		}

		let column_names = await connection.query(column_statement);
		if(column_names.length < 1 || !Array.isArray(column_names[0])) {
			connection.close();
			return result;
		}

		column_names[0].forEach((item, key) => {
			result.push(item.COLUMN_NAME);
		})

		// close connection from pool
		connection.close();

		return new Set(result);
    } 

	async _create_table_from_object(obj, name = null) {

	  let keys = [];
	  if (!Array.isArray(obj) && typeof obj === 'object') {
	    keys = Object.keys(obj);
	  } else {
	    keys = obj;
	  }

	  let column_string = '';
	  let hash = crypto.createHmac('sha256', crypto.randomBytes(32)
	    .toString('hex') + '')
	    .update(keys.length + '')
	    .digest('hex');

	  if (name === null) {
	    name = ('p' + hash);
	  }

	  // SQL tables can have a maximum of 32 chars
	  name = name.replace(/\W/g, '')
	    .slice(0, 32);

	  // Add primary key
	  column_string = '_id_midas INT NOT NULL AUTO_INCREMENT PRIMARY KEY,';
	  //column_string = '';
	  keys.forEach((key) => {
	    // normalize column names (dot . is a reserves named)
	    key = this._escape_column_name(key);
	    // replace reserved word
	    if(key === '_id_midas') {
	      return;
	      key = '_id_midas_'+hash.slice(0,4);
	    }
	    column_string += `\`${key}\`` + ' varchar(255),';
	  });

	  // chop off last ,
	  column_string = column_string.slice(0, -1);
	  // create the connection
	  let connection = await this._get_connection();
	  // query database
	  await connection.execute(`CREATE TABLE IF NOT EXISTS ${name} (${column_string});`);
	  // close connection
	  connection.close();

	  return name;
	}

	// check https://stackoverflow.com/questions/15271202/mysql-load-data-infile-with-on-duplicate-key-update
	async _load_data_in_file_on_duplicate_key_update(data, table_name) {
		let connection = await this._get_connection();

		// creat temporary table
		let temporary_table_name = crypto.createHmac('sha256', crypto.randomBytes(32)
	    .toString('hex') + '')
	    .digest('hex').slice(0, 32);
		let temporary_table_statement = `CREATE TEMPORARY TABLE ${SqlString.escapeId(temporary_table_name)} LIKE ${SqlString.escapeId(table_name)}`;

		await connection.execute(temporary_table_statement);

		// TODO drop indexes
		// ...

		// Load file into temporary CSV
		let file_path = await this._write_data_to_csv(data);
		let column_names = await this._get_column_names_from_table(this.config._target.database, table_name);


		// Load data infile
		let temp_c = [...column_names].map(column => '`' + this._escape_column_name(column) + '`');
		let no_id = '';

		// Check if data contains the _id_midas property
		if(data.length > 0 && typeof data[0]['_id_midas'] === 'undefined') {
			temp_c = temp_c.filter(e => e !== '`_id_midas`');
			no_id = 'SET _id_midas = NULL;'
		}

		//temp_c.splice(1,1);
		let infile_statement = `LOAD DATA LOCAL INFILE '${file_path}' INTO TABLE ${SqlString.escapeId(temporary_table_name)}
								  FIELDS TERMINATED BY ','
								  LINES TERMINATED BY '\n'
								  IGNORE 1 LINES
								  (${temp_c.join(',')})
								  ${no_id}`;
		await connection.query(infile_statement);

		// Insert data
		let insert_statement = `INSERT INTO ${SqlString.escapeId(table_name)}
								SELECT * FROM ${temporary_table_name}
								ON DUPLICATE KEY UPDATE ${temp_c.map(column => `${column} = VALUES(${column})` ).join(',')};`
		//console.log(insert_statement);
		await connection.execute(insert_statement);

		// Drop temporary table
		let drop_temp_table_statement = `DROP TEMPORARY TABLE ${SqlString.escapeId(temporary_table_name)}`;
		await connection.execute(drop_temp_table_statement);

		// Remove temporary file
		await fs.remove(file_path);

		// Close connection
		connection.close();
	}

	async _write_data_to_csv(data) {
		let options = {
		    delimiter   : ',',
		    wrap        : false
		};

    	let data_string = csvjson.toCSV(data, options);

		let random_hash = crypto.createHmac('sha256', crypto.randomBytes(32)
	    .toString('hex') + '')
	    .digest('hex');
	    let file_path = __dirname + path.sep + 'TEMP_MIDAS_TABLE_FILE__' + random_hash;

        let result = await fs.outputFile(file_path, data_string);

        return file_path;
	} 

    async load(data) {

    	let result = false;
    	let flattened = flat(data[0]);
    	let table_name = '';
    	let keys = new Set(Object.keys(flattened));
    	let columns_to_create = [];
    	let alter_columns_result = null;
    	let column_names = await this._get_column_names_from_table(this.config._target.database, this.config._target.table);

    	// check if it is required to create a new table
    	if(column_names.length === 0) {
    		table_name = await this._create_table_from_object(flattened, this.config._target.table);
    		result = true;
    	} 
    	// Add alter base table
    	else {
    		keys = new Set([...keys].map(x => this._escape_column_name(x)));
    		columns_to_create = new Set([...keys].filter(x => !column_names.has(x)));
    		alter_columns_result = await this._create_columns(this.config._target.table, columns_to_create);
    		table_name = this.config._target.table;   
    		result = true; 		
    	}

    	// Load actual data
    	await this._load_data_in_file_on_duplicate_key_update(data, table_name);

	   	return result;
    }

}

export { MySQLLoader as default}