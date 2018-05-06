#!/usr/bin/env node

import Config from './Config/Config';	
import Midas from './midas';	
import Wizard from './Wizard/Wizard';

import fs from 'fs';
import RecursiveIterator from 'recursive-iterator';
import read_json_sync from 'read-json-sync';

// Loader
import JSONLoader from './Loader/JSONLoader';

// CMD Args
import inquirer from 'inquirer';
import command_line_args from 'command-line-args';
const main_definitions = [
	{ name: 'command', defaultOption: true }  	
];

const main_options = command_line_args(main_definitions, { stopAtFirstUnknown: true });
const argv = main_options._unknown || [];

// Enricher
if (main_options.command === 'enrich') {

	const merge_definitions = [
		{ name: 'config', type: String, alias: 'c' }
	]
	const merge_options = command_line_args(merge_definitions, { argv });

	let midas = new Midas(new Config(merge_options.config).get_config_object_sync());
	midas.touch();
}

// Scaffolding
if (main_options.command === 'init') {

	let wizard = new Wizard();
	wizard.start();
	
}