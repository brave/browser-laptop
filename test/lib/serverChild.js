var http = require('http')
var emptyPort = require('empty-port')
var nodeStatic = require('node-static')

var EventEmitter = require('events').EventEmitter

var root = process.argv[2]

var server

function Server () {
  EventEmitter.call(this)
}

Server.prototype = {
  __proto__: EventEmitter.prototype,

  /**
   * Http server running in this process.
   */
  http: null,

  /**
   * A map of corked URLs.
   */
  corkedUrls: {},

  /**
   * A map of chunked URLs.
   * These URLs have transfer-encoding chunked set on them, and by default send only a doctype.
   */
  chunkedUrls: {},

  /**
   * A map of protected URLs.
   */
  authUrls: {},

  stop: function () {
    if (this.http) {
      try {
        this.http.kill()
      } catch (e) {
        console.error('Could not kill http server', e)
      }
    }
  },

  start: function (port) {
    // using node-static for now we can do fancy stuff in the future.
    var file = new nodeStatic.Server(root)

    // temporary state to control 3rd-party fingerprinting with favicons
    var faviconCookieDetected = false
    this.http = http.createServer(function (req, res) {
      req.addListener('end', function () {
        // Handle corked urls.
        var fullUrl = 'http://' + req.headers.host + req.url
        if (server.chunkedUrls[fullUrl]) {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8')
          res.setHeader('Transfer-Encoding', 'chunked')
          res.write('<!DOCTYPE html>')

          // TODO: Serving the file with nodestatic here throws an error as we have already sent headers.
          // For now just send a static string instead of file, when the server is uncorked.
          server.once('uncorked ' + fullUrl, function () {
            res.end('(fixme)')
          })
          return
        }

        if (server.corkedUrls[fullUrl]) {
          server.once('uncorked ' + fullUrl, file.serve.bind(file, req, res))
          return
        }

        // Handle protected URLs.
        // Users can login with 'username' and 'password'
        if (server.authUrls[fullUrl] &&
          req.headers.authorization !== 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=') {
          res.writeHead(401, {
            'WWW-Authenticate': 'Basic realm="login required"'
          })
          res.end()
          return
        }

        // the following routes are setup to test 3rd-party cookie sharing over favicons
        if (req.url === '/cookie-favicon.ico') {
          if (req.headers.cookie && req.headers.cookie !== '') {
            faviconCookieDetected = true
          }
          file.servePath('/img/test.ico', 200, {}, req, res, () => res.end())
          return
        }

        if (req.url === '/cookie-favicon-test.html') {
          file.servePath(req.url, 200, {
            'Set-Cookie': 'new-cookie'
          }, req, res, () => res.end())
          return
        }

        if (req.url === '/cookie-favicon-test-result.html') {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          })
          const text = faviconCookieDetected ? 'fail' : 'pass'
          res.end(`<body>${text}</body>`)
          return
        }

        // hand off request to node-static
        file.serve(req, res)
      }).resume()
    }).listen(port)
  },

  cork: function (url) {
    this.corkedUrls[url] = true
  },

  uncork: function (url) {
    delete this.corkedUrls[url]
    this.emit('uncorked ' + url)
  },

  chunk: function (url) {
    this.chunkedUrls[url] = true
  },

  unchunk: function (url) {
    delete this.chunkedUrls[url]
  },

  protect: function (url) {
    this.authUrls[url] = true
  },

  unprotect: function (url) {
    delete this.authUrls[url]
  }
}

server = new Server()

// figure out which port we are on
emptyPort({}, function (err, port) {
  if (err) {
    console.error(err.stack)
  }
  server.start(port)
  process.send(['start', port])
})

// handle process messages
process.on('message', function (data) {
  switch (data.action) {
    case 'cork':
      server.cork(data.args)
      break
    case 'uncork':
      server.uncork(data.args)
      break
    case 'chunk':
      server.chunk(data.args)
      break
    case 'unchunk':
      server.unchunk(data.args)
      break
    case 'protect':
      server.protect(data.args)
      break
    case 'unprotect':
      server.unprotect(data.args)
      break
    case 'stop':
      server.stop()
      break
  }
})
