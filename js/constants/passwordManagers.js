/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const passwordManagers = {
  BUILT_IN: 'BuiltIn',
  ONE_PASSWORD: '1Password',
  DASHLANE: 'Dashlane',
  LAST_PASS: 'LastPass',
  ENPASS: 'Enpass',
  BITWARDEN: 'Bitwarden',
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
displayNames[passwordManagers.BITWARDEN] = 'Bitwarden'
displayNames[passwordManagers.UNMANAGED] = null

let publicKeys = {}
publicKeys[passwordManagers.BUILT_IN] = null
publicKeys[passwordManagers.ONE_PASSWORD] = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCB4Mf0xWDqstptZh7gqocHL+RT36ZJo/iJ0kZmLyC8vxCsGS26Loidt69KPBVlfuBI0FaWL25NVB2sVdj7wNsCvQIn7ImQwSB5Audq2B3uQzk70RA7SmGE9ndIKsKs4L19n8avhg4ohejyBiI5nrUegs94i0tMpFVeedmTOO4+eQIDAQAB'
publicKeys[passwordManagers.DASHLANE] = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArf+Mb0ro41bJ+FURIhp7YhwTyaP1UbJY2pMApYFTnl1F++bW65Zf80pwIRFt4b6VUQ7qt3kNE3XWrN5VUpbO5pasQZLk4czaEJzFBGPsxFfe89guXb2Xd6CGAHpfdn+wPIU8hMie0ajoUqIC+YWjEZJ0vf3lP0r9EpEbPUSCdg1SjvLb/NzNzq2h/Eev/BfcrEZ7e3wEb9NgM2/pdP2tfowmBg6xLuoiUz2TaQbTVoBRgmkpik3gy4KojFaHgdidT7AVGIpmHZycEd491E9MG/mHuQ0nWZD9pJOp9n1dBHA4LAq5WxU6f/K+h+qhekWO7KVK0M3/mwxxGhizPbjpJQIDAQAB'
publicKeys[passwordManagers.LAST_PASS] = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCiL9y2jziKp5kjb13uYG1bAXsuemUKAYUAwR/N9qTuhMIuly02Ecm63dOkn+M2r26IGfDE/lbPv/dB/W+d34pqGo5uJJY+Omt9t3xsIuz7mQwuvF1H5ozj0OHok5XDFRaBIfPa06RhQw3M7sSZJvQ+qqD3+dr0aLX+mvi0LQ11uQIDAQAB'
publicKeys[passwordManagers.ENPASS] = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhFoAKtOOPY0X3R4soa2r8x3Gy/n23XC/Dn+iTAKR1P1tWgp4pmf1J1l0jI3rYGiVc5ATlawwCgVp5Z1l1PVAEdKmDtHQjbHr5Hwb6W86xwWz+ru2usxVMHcfQlUJdFPKuxValknC4V3XayU9cH+/mo1RCSAfTCKWgqCA2efxK52+FsStwjR9/qjUnVJOGqS0EQmhIfwhdDMpea0XZ67FkTJbRb7wtC6MjIBEcWKvPztpge/vMoyhiLjTckq5kKBbgENOuZe7PvymwWxD0J0ZVfDE6VNQaV7Pkbx9werteHzoAYdSXdj5MKIhL029/zVn3BpCkpEZBr+M2ZXXotEAiwIDAQAB'
publicKeys[passwordManagers.BITWARDEN] = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmqKbvreshyXRuN2gikeR1idqR6KL0Di89JZcMyD4bjJRZVmQO7aznSGSALIHzSAUGYocUYBNDOP5QAhImxXyQ1qG8+goXs93v9GzrNJETdVuCEhqBggC4/DFabryJZDiKvZ2Jl0DM7MsWdoybZPwrj70V3aJ/nVNOMkf868scNTMliwitCqqjT5baTANsG0DkZWQExD4lSXzSZHH9MEO8q0iZ7RRlNuGRBAkZgNV8FwZRsPKm/rwQ9dy3VpgLcmLp5GiMt+kAEncqKAkuRYnhVXXBsKqIyYTMjHSLkLnpfFySyOPLBdS617i/PGNiP/MT6Xy6z//v5NozUgaAZ4gJQIDAQAB'
publicKeys[passwordManagers.UNMANAGED] = null

const thirdPartyPasswordManagers = Object.keys(extensionIds)
  .map(key => key && extensionIds[key])
  .filter(key => key !== null)

module.exports = {
  passwordManagers,
  defaultPasswordManager,
  extensionIds,
  displayNames,
  publicKeys,
  thirdPartyPasswordManagers
}
