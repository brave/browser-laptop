/* global describe, it, before */

const Brave = require('../lib/brave')

const testUrl = 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/muon-tests.html'
const testCases = require('../muon-native').collect()

function * setup (client) {
  yield client.waitForUrl(Brave.newTabUrl).waitForBrowserWindow()
}

describe('muon tests', function () {
  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
    yield this.app.client
      .tabByIndex(0)
      .url(testUrl)
  })

  const makeKey = (key, ext) => `${key} → ${ext}`
  // selector must match the pattern used in muonTest.entry.js
  const makeSelector = (key) => `#${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`

  const executeTests = (name, successKey, tests) => {
    const runnableTests = Object.keys(tests).filter((k) => typeof tests[k] === 'function')
    if (runnableTests.length) {
      // actual tests, with a `function`
      for (let testName of runnableTests) {
        it(testName, function * () {
          const selector = makeSelector(makeKey(successKey, testName))
          yield this.app.client.waitForVisible(selector).then(() => {
            // got the element for this particular test, check the pass/fail and report from there
            return this.app.client.getText(`${selector}>.passFail`).then((value) => {
              if (Array.isArray(value)) {
                // it's possible to have multiple tests with the same key, mainly due to the
                // selector character clobbering, these show up as an array of elements
                throw new Error(`Multiple tests with same selector "${selector}", please modify their names`)
              }
              if (value !== 'PASS') {
                return this.app.client.getText(`${selector}>.failure`).then((value) => {
                  // attempt to get at least some of the error message from the .failure element to report back
                  throw new Error(value)
                })
              }
            })
          })
        })
      }
    }

    const testGroups = Object.keys(tests).filter((k) => typeof tests[k] === 'object')
    for (let groupKey of testGroups) {
      // groups of tests, nested objects presumably containing functions
      describe(groupKey, () => {
        executeTests(groupKey, makeKey(successKey, groupKey), tests[groupKey])
      })
    }
  }

  executeTests('muon', 'muon', testCases)
})
