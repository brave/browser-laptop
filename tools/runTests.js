var glob = require('glob')
process.env.NODE_ENV = 'test'

var Mocha = require('mocha')
var mocha = new Mocha()

glob('test/**/*Test.js', function (err, files) {
  if (err) {
    console.error(err)
    return
  }
  files.forEach(mocha.addFile.bind(mocha))
  mocha.run(function (failures) {
    process.on('exit', function () {
      process.exit(failures)
    })
  })
})

process.on('SIGINT', function () {
  console.log('Caught interrupt signal')
  mocha = null
  process.exit(1)
})
