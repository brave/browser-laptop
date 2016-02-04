module.exports = {
  events: {},
  embedder: null,
  processMessage: function (event) {
    if (event.origin === 'file://') {
      this.embedder = this.embedder || event.source
      var cb = this.events[event.data[0]]
      cb && cb.apply(null, event.data)
    }
  },
  on: function (name, cb) {
    this.events[name] = cb
  },
  send: function () {
    var args = Array.prototype.slice.call(arguments)
    this.embedder && this.embedder.postMessage(args, 'file://')
  }
}

window.addEventListener('message', module.exports.processMessage.bind(module.exports))
