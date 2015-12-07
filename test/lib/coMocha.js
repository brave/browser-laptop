var mocha = require('mocha')
var coMocha = require('co-mocha')
coMocha(mocha)

require('babel-polyfill')
