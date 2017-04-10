/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const passwordManagers = {
  BUILT_IN: 'BuiltIn',
  ONE_PASSWORD: '1Password',
  DASHLANE: 'Dashlane',
  LAST_PASS: 'LastPass',
  ENPASS: 'Enpass',
  BITWARDEN: 'bitwarden',
  UNMANAGED: 'Unmanaged'
}

const defaultPasswordManager = passwordManagers.BUILT_IN

let extensionIds = {}
extensionIds[passwordManagers.BUILT_IN] = null
extensionIds[passwordManagers.ONE_PASSWORD] = 'aomjjhallfgjeglblehebfpbcfeobpgk'
extensionIds[passwordManagers.DASHLANE] = 'fdjamakpfbbddfjaooikfcpapjohcfmg'
extensionIds[passwordManagers.LAST_PASS] = 'hdokiejnpimakedhajhdlcegeplioahd'
extensionIds[passwordManagers.ENPASS] = 'kmcfomidfpdkfieipokbalgegidffkal'
extensionIds[passwordManagers.BITWARDEN] = 'nngceckbapebfimnlniiiahkandclblb'
extensionIds[passwordManagers.UNMANAGED] = null

let displayNames = {}
displayNames[passwordManagers.BUILT_IN] = null
displayNames[passwordManagers.ONE_PASSWORD] = '1Password'
displayNames[passwordManagers.DASHLANE] = 'Dashlane'
displayNames[passwordManagers.LAST_PASS] = 'LastPass'
displayNames[passwordManagers.ENPASS] = 'Enpass'
displayNames[passwordManagers.BITWARDEN] = 'bitwarden'
displayNames[passwordManagers.UNMANAGED] = null

const thirdPartyPasswordManagers = Object.keys(extensionIds)
  .map(key => key && extensionIds[key])
  .filter(key => key !== null)

module.exports = {
  passwordManagers,
  defaultPasswordManager,
  extensionIds,
  displayNames,
  thirdPartyPasswordManagers
}
