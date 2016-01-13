var path = require('path')
var execute = require('./execute')

var env = {
  NODE_ENV: 'development'
}

execute('electron "' + path.join(__dirname, '..') +  '" --debug=5858', env)
