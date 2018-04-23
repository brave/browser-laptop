// test cases in this directory, should be resolvable with `require('./X')`
const testCases = [
  'urlParseTest',
  'urlutilTest',
  'suggestionTest',
  'siteSuggestionTest'
]

// load all of the tests into a single large nested object
const collect = () => {
  const testList = {}
  for (let testCase of testCases) {
    testList[testCase] = require(`./${testCase}`)
  }
  return testList
}

const run = (testRunner) => {
  // first collect an array of ordered runnable tests, each is async-ish in that it has a
  // callback but the underlying test may not, we just treat them all that way
  const runQueue = []

  const buildRunQueue = (successKey, tests) => {
    const ctx = {} // for `this` within a current nested block

    const makeTestExecutor = (testName, key) => {
      const beforeAfter = testName === 'before' || testName === 'after'
      const testFn = tests[testName]

      runQueue.push((cb) => {
        const thisRunner = testRunner(key)
        // before and after are async if they have 1 arg, a callback
        // all other tests take a `test` argument first and if they have a second argument it's a callback
        if (testFn.length > (beforeAfter ? 0 : 1)) {
          const _cb = (err) => {
            thisRunner.ok(!err)
            thisRunner.done()
            cb()
          }
          testFn.call(ctx, beforeAfter ? _cb : thisRunner, beforeAfter ? undefined : _cb)
        } else {
          testFn.call(ctx, beforeAfter ? undefined : thisRunner)
          thisRunner.done()
          cb()
        }
      })
    }

    // before() always goes first within a block
    if (typeof tests.before === 'function') {
      makeTestExecutor('before', `${successKey} → before`)
    }

    for (let name of Object.keys(tests)) {
      if (name === 'before' || name === 'after') {
        continue
      }
      let key = `${successKey} → ${name}`
      if (typeof tests[name] === 'object') {
        buildRunQueue(key, tests[name]) // recursive for a nested block of tests
      } else {
        makeTestExecutor(name, key)
      }
    }

    // after() always goes last within a block
    if (typeof tests.after === 'function') {
      makeTestExecutor('after', `${successKey} → after`)
    }
  }

  buildRunQueue('muon', collect())

  // now we have a queue of ordered tests, execute in order, async-ish
  const executeQueue = () => {
    if (!runQueue.length) {
      return
    }
    const fn = runQueue.shift()
    fn(() => {
      setImmediate(executeQueue)
    })
  }

  executeQueue()
}

module.exports.collect = collect
module.exports.run = run
