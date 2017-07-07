'use strict'

module.exports.categories = {
  BOOKMARKS: '0',
  HISTORY_SITES: '1',
  PREFERENCES: '2'
}

module.exports.actions = {
  CREATE: 0,
  UPDATE: 1,
  DELETE: 2
}

module.exports.categoryMap = {
  bookmark: 'BOOKMARKS',
  historySite: 'HISTORY_SITES',
  siteSetting: 'PREFERENCES',
  device: 'PREFERENCES'
}
