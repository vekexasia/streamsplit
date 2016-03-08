#!/usr/bin/env node
//require('babel-core/register');
var moment       = require('moment');
var program      = require('commander');
var fs           = require('fs');
var StreamSearch = require('streamsearch');
var Decimal      = require('decimal.js');
var Splitter     = require('./dist/index.js');
var MysqlHandler = require('./dist/MysqlbackupFileHandler.class.js');
//var Splitter     = require('./src/index.es6');
//var MysqlHandler = require('./src/MysqlbackupFileHandler.class.es6');


program
  .version('0.0.1')
  .usage('[options] <file>')
  .option('-o, --optional [value]', 'An optional value')
  .parse(process.argv);

if (program.args.length != 1) {
  program.outputHelp();
} else {
  new Splitter(program.args[0], new MysqlHandler()).process();
}