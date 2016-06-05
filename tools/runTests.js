var execute = require('./lib/execute')

var env = {
  NODE_ENV: 'test'
}

execute('mocha --compilers js:babel-register --recursive $(find test -name \'*Test.js\')', env)
