function Server (root, port, child) {
  this.root = root
  this.port = port
  this.child = child
}

Server.prototype = {
  /**
   * Formats given input with localhost and port.
   *
   * @param {String} path part of url.
   * @return {String} url of location.
   */
  url: function (path) {
    return 'http://localhost:' + this.port + '/' + path
  },

  urlWithIpAddress: function (path) {
    return 'http://127.0.0.1:' + this.port + '/' + path
  },

  urlOrigin: function () {
    return 'http://localhost:' + this.port
  },

  /**
   * Sends signal to stop child process and stop server.
   */
  stop: function () {
    this.child.send({
      action: 'stop'
    })
    this.child.kill()
  },

  /**
   * Cork the response body of the given url while allowing headers.
   * @param {String} url to cork
   */
  cork: function (url) {
    this.child.send({
      action: 'cork',
      args: url
    })
  },

  /**
   * Allow the body to be sent after calling `.cork`.
   * @param {String} url to uncork
   */
  uncork: function (url) {
    this.child.send({
      action: 'uncork',
      args: url
    })
  },

  /**
   * Chunks response until it's uncorked.
   * @param {String} url to chunk
   */
  chunk: function (url) {
    this.child.send({
      action: 'chunk',
      args: url
    })
  },

  /**
   * Allow the body to be sent after calling `.cork`.
   * @param {String} url to uncork
   */
  unchunk: function (url) {
    this.child.send({
      action: 'unchunk',
      args: url
    })
  },

  /**
   * Allows replacing the default headers sent with a url
   * @param {String} url for response
   * @param {Object} new headers to use with response
   */
  defineHeaders: function (url, headers) {
    this.child.send({
      action: 'defineHeaders',
      args: {
        url: url,
        headers: headers
      }
    })
  },

  /**
   * Protects a URL using HTTP authentication.
   * @param {String} url to protect
   */
  protect: function (url) {
    this.child.send({
      action: 'protect',
      args: url
    })
  },

  /**
   * Stops protecting a URL.
   * @param {String} url to protect
   */
  unprotect: function (url) {
    this.child.send({
      action: 'unprotect',
      args: url
    })
  }
}

/**
 * Spawn the child process where the http server lives.
 *
 * @param {Function} callback [Error err, Server server].
 */
Server.create = function (root, callback) {
  const fork = require('child_process').fork
  const child = fork(`${__dirname}/serverChild.js`, [root])

  process.on('exit', () => child.kill('SIGQUIT'))
  process.on('SIGHUP', () => child.kill('SIGHUP'))
  process.on('SIGINT', () => child.kill('SIGINT'))
  process.on('SIGQUIT', () => child.kill('SIGQUIT'))
  process.on('SIGABRT', () => child.kill('SIGABRT'))
  process.on('SIGTERM', () => child.kill('SIGTERM'))

  // wait for start message ['start', PORT_NUMBER].
  child.on('message', function (data) {
    if (Array.isArray(data) && data[0] === 'start') {
      callback(null, new Server(root, data[1], child))
    }
  })
}

module.exports = Server
