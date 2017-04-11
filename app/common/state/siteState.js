const assert = require('assert')
const {makeImmutable, isMap, isList} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('sites')), 'state must contain an Immutable.List of sites')
  return state
}

const siteState = {
  getSites: (state) => {
    state = validateState(state)
    return state.get('sites')
  }
}

module.exports = siteState
