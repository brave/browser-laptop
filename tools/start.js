var path = require('path')
var execute = require('./lib/execute')
var fs = require('fs')
var port = process.env.BRAVE_PORT ? process.env.BRAVE_PORT : 8080
var indexPath = path.join('app/index-dev.html')

var env = {
  NODE_ENV: 'development'
}

fs.writeFileSync(
	indexPath,
	fs.readFileSync(indexPath, 'utf8').replace(/localhost:\d*/g, 'localhost:' + port),
	'utf8'
)

execute('electron "' + path.join(__dirname, '..') + '" ' + process.argv[2], env)
