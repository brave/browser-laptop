const testCases = [
  'urlParseTest',
  'urlutilTest',
  'suggestionTest'
]

const collect = () => {
  const testList = {}

  for (let testCase of testCases) {
    const tests = require(`./${testCase}`)
    testList[testCase] = {}

    const setNames = (to, from) => {
      const names = Object.keys(from)
      for (let name of names) {
        if (typeof from[name] === 'object') {
          setNames(to[name] = {}, from[name])
        } else {
          to[name] = from[name]
        }
      }
    }

    setNames(testList[testCase], tests)
  }

  return testList
}

const run = (testRunner) => {
  const runTests = (successKey, tests) => {
    for (let name of Object.keys(tests)) {
      let key = `${successKey} → ${name}`
      if (typeof tests[name] === 'object') {
        runTests(key, tests[name])
      } else {
        const thisRunner = testRunner(key)
        tests[name](thisRunner)
        thisRunner.done()
      }
    }
  }

  runTests('muon', collect())
}

module.exports.collect = collect
module.exports.run = run
