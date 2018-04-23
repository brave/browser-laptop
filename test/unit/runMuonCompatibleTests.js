/* global describe, it, before, after */

const assert = require('assert')
require('./braveUnit')

const executeTests = (name, tests) => {
  describe(name, function () {
    const runnableTests = Object.keys(tests).filter((k) => typeof tests[k] === 'function')
    if (runnableTests.length) {
      for (let testName of runnableTests) {
        if (testName === 'before') {
          before(tests[testName])
        } else if (testName === 'after') {
          after(tests[testName])
        } else {
          const wrapper = tests[testName].length > 1
            ? function (cb) { tests[testName].call(this, assert, cb) }
            : function () { tests[testName].call(this, assert) }
          it(testName, wrapper)
        }
      }
    }

    const testGroups = Object.keys(tests).filter((k) => typeof tests[k] === 'object')
    for (let groupName of testGroups) {
      executeTests(groupName, tests[groupName])
    }
  })
}

module.exports = executeTests
