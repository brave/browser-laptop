
const urlFormat = require('url').format
const _ = require('underscore')

const urlParse = require('../../common/urlParse')

const getInfoKey = (url) => {
  if (typeof url !== 'string') {
    return null
  }

  return urlFormat(_.pick(urlParse(url), [ 'protocol', 'host', 'hostname', 'port', 'pathname' ]))
}

module.exports = {
  getInfoKey
}
