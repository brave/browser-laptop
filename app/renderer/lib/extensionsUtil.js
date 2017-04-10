/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {makeImmutable} = require('../../common/state/immutableUtil')
const {passwordManagers, extensionIds, thirdPartyPasswordManagers} = require('../../../js/constants/passwordManagers')
const config = require('../../../js/constants/config')
const settings = require('../../../js/constants/settings')

const bitwarden = extensionIds[passwordManagers.BITWARDEN]
const brave = config.braveExtensionId
const dashlane = extensionIds[passwordManagers.DASHLANE]
const enpass = extensionIds[passwordManagers.ENPASS]
const lastpass = extensionIds[passwordManagers.LAST_PASS]
const onepassword = extensionIds[passwordManagers.ONE_PASSWORD]
const pdfjs = config.PDFJSExtensionId
const pocket = config.PocketExtensionId
const sync = config.syncExtensionId
const webtorrent = config.torrentExtensionId
const vimium = config.vimiumExtensionId

/**
 * Stores dummy data for all known extensions based on vault-updater extension manifest.
 * @see https://github.com/brave/vault-updater/blob/master/data/stable/extensions/extensionManifest.json
 * Ideally this should be removed once we can fetch all available extensions and stored as a state.
 *
 * Properties such as name and description are referenced like keys for proper l10n
 */
const dummyData = [
  // { id: bitwarden, // TBD },
  {
    id: dashlane,
    name: 'l10nDashlane',
    description: 'l10nDashlaneDesc',
    icon: 'img/extensions/dashlane-128.png'
  // { id: enpass // TBD },
  }, {
    id: lastpass,
    name: 'l10nLastpass',
    description: 'l10nLastpassDesc',
    icon: 'img/extensions/lastpass-128.png'
  }, {
    id: onepassword,
    name: 'l10nOnepassword',
    description: 'l10nOnepasswordDesc',
    icon: 'img/extensions/1password-128.png'
  }, {
    id: pocket,
    name: 'l10nPocket',
    description: 'l10nPocketDesc',
    icon: 'img/extensions/pocket-128.png'
  }
  // { id: 'vimium' // TBD }
]

/**
 * Populate default extensions with dummy extension data
 * Util to make all available extensions visible when they're not installed by default
 * @param {Map} extensionState - Application's extensions state
 * @returns {Map} A Map with all available extensions
 */
module.exports.populateDefaultExtensions = (extensionsState) => {
  let newState = makeImmutable(extensionsState)

  dummyData.map(data => {
    let dummyExtensionManifest = makeImmutable({
      [data.id]: {
        'isDummy': true,
        'enabled': false,
        'name': data.name,
        'url': `chrome-extension://${data.id}/`,
        'manifest': {
          'icons': {
            '128': data.icon
          }
        },
        base_path: '',
        version: data.version,
        id: data.id,
        description: data.description
      }
    })

  // At the time of this writing we don't have access to any extension data
  // unless it's installed. In such cases populate extensions state
  // with our dummy content.
    if (!newState.get(data.id)) {
      newState = newState.set(data.id, dummyExtensionManifest.get(data.id))
    }
  })

  // TODO: @cezaraugusto convert to list or use valueSeq to avoid
  // warning about Using Maps as children
  return newState
}

/**
 * Get extension setting option
 * @param {String} extensionId - The current extension ID
 * @returns {String} The given setting option
 */
module.exports.getExtensionKey = (extensionId) => {
  let extensionSetting
  switch (extensionId) {
    case bitwarden:
      extensionSetting = passwordManagers.BITWARDEN
      break
    case dashlane:
      extensionSetting = passwordManagers.DASHLANE
      break
    case enpass:
      extensionSetting = passwordManagers.ENPASS
      break
    case lastpass:
      extensionSetting = passwordManagers.LAST_PASS
      break
    case onepassword:
      extensionSetting = passwordManagers.ONE_PASSWORD
      break
    case pdfjs:
      extensionSetting = settings.PDFJS_ENABLED
      break
    case pocket:
      extensionSetting = settings.POCKET_ENABLED
      break
    case webtorrent:
      extensionSetting = settings.TORRENT_VIEWER_ENABLED
      break
    case vimium:
      extensionSetting = settings.VIMIUM_ENABLED
      break
    default:
      break
  }
  return extensionSetting
}

/**
 * Check if extensions is built-in
 * @param {String} extensionId - The current extension ID
 * @returns {Boolean} Wheter or not extension is built-in
 */
module.exports.isBuiltInExtension = (extensionId) => {
  return [brave, sync, webtorrent].includes(extensionId)
}

/**
 * Check whether or not extension is a password manager
 * @param {String} extensionId - The current extension ID
 * @returns {Boolean} Wheter or not extension is a password manager
 */
module.exports.isPasswordManager = (extensionId) => {
  return thirdPartyPasswordManagers.includes(extensionId)
}

/**
 * Replace Google Chrome text with Brave
 * @param {String} text - The text to check against
 * @returns {String} Text with replaced string
 */
module.exports.bravifyText = (text) => {
  return text && text.replace(/Chrome|Google ?Chrome/g, 'Brave')
}
