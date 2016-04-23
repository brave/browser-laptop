var path = require('path')
var execute = require('./lib/execute')

var env = {
  NODE_ENV: 'development'
}

execute('electron "' + path.join(__dirname, '..') + '" ' + process.argv.slice(2).join(' '), env)
