var path = require('path')
var execute = require('./execute')

var env = {
  NODE_ENV: 'development'
}

execute('electron "' + path.join(__dirname, '..') + '" ' + process.argv[2], env)
