const fakeLevel = (pathName) => {
  return {
    batch: function (entries, cb) {
      if (typeof cb === 'function') cb()
    },
    get: function (key, cb) {
      if (typeof cb === 'function') cb(null, '{"' + key + '": "value-goes-here"}')
    }
  }
}

module.exports = fakeLevel
