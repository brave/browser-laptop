/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Cache of URLs mapped their site settings.
 * This gets rebuilt when site settings or a bravery setting is changed.
 */
const currentBraverySettingsCache = new Map()

const clearBraverySettingsCache = () => {
  currentBraverySettingsCache.clear()
}

const getBraverySettingsCache = (url, isPrivate) => {
  const key = generateKey(url, isPrivate)
  return currentBraverySettingsCache.get(key)
}

const updateBraverySettingsCache = (url, isPrivate, braverySettings) => {
  const key = generateKey(url, isPrivate)
  currentBraverySettingsCache.set(key, braverySettings)
}

const generateKey = (url, isPrivate) => {
  return `${url}|${isPrivate}`
}

module.exports = {
  clearBraverySettingsCache,
  getBraverySettingsCache,
  updateBraverySettingsCache
}
