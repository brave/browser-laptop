const electron = require('electron')
const app = electron.app
const protocol = electron.protocol
const config = require('../../../js/constants/config')


function registerBZZProtocols() {
  config.bzzUrlSchemes.forEach(scheme => {
    protocol.registerHttpProtocol(scheme, (request, callback) => {
      const url = request.url.substr(scheme.length + 3) // scheme length + 3 character for ://
      console.log(`$$$ ${scheme} Protocol request: `, request)
      const payload = {
        method: request.method,
        referrer: request.referrer,
        url: `https://test.bzz.network/${scheme}:/${url}`
      }
      callback(payload)
    }, (error) => {
      if (error) console.error('Failed to register protocol')
      console.log(`$$$ ${scheme} Protocol registered!`)
    })
  })
}

module.exports = {
  registerBZZProtocols,
}
