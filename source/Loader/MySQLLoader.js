import Loader from './Loader';
import flat from 'flat';
import SqlString from 'sqlstring';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

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

    async _check_if_table_exists(database, table_name) {
    	database = SqlString.escape(database);
    	table_name = SqlString.escape(table_name);

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
			return result;
		}

		let column_names = await connection.query(column_statement);
		if(column_names.length < 1 || !Array.isArray(column_names[0])) {
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

	  console.log('22asdasd  ' + name);  

	  // Add primary key
	  column_string = '_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,';
	  //column_string = '';
	  keys.forEach((key) => {

	    // normalize column names (dot . is a reserves named)
	    key = key.trim().toLowerCase().replace(/ /g, '_').replace(`'`, '').replace(/\./g, ':');

	    // replace reserved word
	    if(key === '_id') {
	      key = '_id_'+hash.slice(0,4);
	    }
	    column_string += SqlString.escapeId(key) + ' varchar(255),';
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

    async load(data) {
    	let flattened = flat(data[0]);
    	let new_table = '';
    	let keys = new Set(Object.keys(flattened));

    	let column_names = await this._get_column_names_from_table(this.config._target.database, this.config._target.table);

    	console.log('TABLE NAME ' +  this.config._target.table);

    	// check if it is required to create a new table
    	if(column_names.length === 0) {
    		new_table = await this._create_table_from_object(flattened, this.config._target.table);
    	}

    	let columns_to_create = new Set([...keys].filter(x => !column_names.has(x)));

    	// TODO implement from here

    	console.log('COLUMN NAME:');
    	console.log(column_names);

    	console.log('');

    	console.log('NEW TABLE NAME:');
    	console.log(new_table);

    	return columns_to_create;

    	console.log(statement);
        return Promise.resolve(statement);
    }

}

export { MySQLLoader as default}