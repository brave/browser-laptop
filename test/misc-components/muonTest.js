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
  const makeSelector = (key) => `#${key.replace(/[^a-zA-Z0-9_\-]/g, '_')}`

  const executeTests = (name, successKey, tests) => {
    const runnableTests = Object.keys(tests).filter((k) => typeof tests[k] === 'function')
    if (runnableTests.length) {
      for (let testName of runnableTests) {
        it(testName, function * () {
          const selector = makeSelector(makeKey(successKey, testName))
          yield this.app.client.waitForVisible(selector).then(() => {
            return this.app.client.getText(`${selector}>.passFail`).then((value) => {
              if (Array.isArray(value)) {
                throw new Error(`Multiple tests with same selector "${selector}", please modify their names`)
              }
              if (value !== 'PASS') {
                return this.app.client.getText(`${selector}>.failure`).then((value) => {
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
      describe(groupKey, () => {
        executeTests(groupKey, makeKey(successKey, groupKey), tests[groupKey])
      })
    }
  }

  executeTests('muon', 'muon', testCases)
})
