/* global describe, it */

const assert = require('assert')
require('./braveUnit')

const executeTests = (name, tests) => {
  describe(name, () => {
    const runnableTests = Object.keys(tests).filter((k) => typeof tests[k] === 'function')
    if (runnableTests.length) {
      for (let testName of runnableTests) {
        it(testName, tests[testName].bind(null, assert))
      }
    }

    const testGroups = Object.keys(tests).filter((k) => typeof tests[k] === 'object')
    for (let groupName of testGroups) {
      executeTests(groupName, tests[groupName])
    }
  })
}

module.exports = executeTests
