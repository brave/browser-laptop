const assert = require('assert')
const tests = require('../test/muon-native/').run

const testRunner = (successKey) => {
  const failures = []
  let assertCount = 0

  const assertWrap = (assertType, assertion, failText) => {
    assertCount++
    try {
      assertion()
    } catch (e) {
      failures.push({ assertCount, assertType, failText })
    }
  }

  const done = () => {
    const elem = document.createElement('div')
    // selector must match the pattern used in muonTest.js
    elem.id = successKey.replace(/[^a-zA-Z0-9_-]/g, '_')
    // passFail is the critical element, it has to contain either 'PASS' or 'FAIL'
    const passFail = document.createElement('span')
    passFail.className = 'passFail'
    passFail.innerText = 'PASS'
    const desc = document.createElement('span')
    desc.innerText = ` ${successKey}`
    const failure = document.createElement('div')
    failure.className = 'failure'
    if (failures.length) {
      passFail.innerText = 'FAIL'
      for (let fail of failures) {
        failure.innerText += `#${fail.assertCount} ${fail.assertType}: ${fail.failText}\n`
      }
    }
    elem.appendChild(passFail)
    elem.appendChild(desc)
    elem.appendChild(failure)
    document.body.appendChild(elem)
  }

  return [ 'ok', 'equal', 'deepEqual', 'strictEqual' ].reduce((wrappedAssert, fn) => {
    wrappedAssert[fn] = (actual, expected) => {
      assertWrap(fn, () => { assert[fn](actual, expected) }, actual)
    }
    return wrappedAssert
  }, { done })
}

tests(testRunner)
