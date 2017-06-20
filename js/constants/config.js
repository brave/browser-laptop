/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// VAULT_HOST can be set to:
// https://vault.brave.com for production
// https://vault-staging.brave.com for a dev build
// http://localhost:3000 for production
const vaultHost = process.env.VAULT_HOST || 'https://vault-staging.brave.com'
const adHost = process.env.AD_HOST || 'https://oip.brave.com'
const bravePort = process.env.BRAVE_PORT || process.env.npm_config_port || process.env.npm_package_config_port
const env = process.env.BRAVE_ENV || process.env.NODE_ENV || 'development'

// make sure BRAVE_ENV and NODE_ENV are always set
process.env.BRAVE_ENV = process.env.BRAVE_ENV || env
process.env.NODE_ENV = process.env.NODE_ENV || env

module.exports = {
  cache: {
    urlParse: 30
  },
  zoom: {
    defaultValue: 0,
    // Each zoomLevel is multiplied by 20 to get the percentage offset from 100. That's 0.05 per percentage offset.
    zoomLevels: [-3.75, -3.35, -2.5, -1.65, -1.25, -0.5, -0.25, 0, 0.25, 0.5, 1.25, 2.5, 3.75, 5, 7.5, 10, 15, 20]
  },
  fingerprintingInfoUrl: 'https://github.com/brave/browser-laptop/wiki/Fingerprinting-Protection-Mode',
  maxClosedFrames: 100,
  menu: {
    // History -> Recently closed frame list
    maxClosedFrames: 10
  },
  thumbnail: {
    width: 160,
    height: 100
  },
  defaultLocale: 'en-US',
  defaultUrl: 'about:newtab',
  urlBarSuggestions: {
    maxOpenedFrames: 2,
    maxHistorySites: 5,
    maxAboutPages: 2,
    maxSearch: 3,
    maxTopSites: 3
  },
  navigationBar: {
    defaultSearchSuggestions: false,
    maxHistorySites: 10
  },
  defaultOpenSearchPath: 'content/search/google.xml',
  vault: {
    syncUrl: (userId) => `${vaultHost}/v1/users/${userId}/appState`,
    authUrl: (userId) => `${vaultHost}/v1/users/${userId}`,
    replacementUrl: adHost
  },
  widevineComponentId: 'oimompecagnajdejgnnjijobebaeigek',
  widevineComponentPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmhe+02cLPPAViaevk/fzODKUnb/ysaAeD8lpE9pwirV6GYOm+naTo7xPOCh8ujcR6Ryi1nPTq2GTG0CyqdDyOsZ1aRLuMZ5QqX3dJ9jXklS0LqGfosoIpGexfwggbiLvQOo9Q+IWTrAO620KAzYU0U6MV272TJLSmZPUEFY6IGQIDAQAB',
  braveExtensionId: 'mnojpmjdmbbfmejpflffifhffcmidifd',
  torrentExtensionId: 'fmdpfempfmekjkcfdehndghogpnpjeno',
  syncExtensionId: 'cjnmeadmgmiihncdidmfiabhenbggfjm',
  // PDFJS
  // Parent repo: https://github.com/diracdeltas/pdf.js
  // Run: gulp run chromium
  // Use Chromium to package build/chormium with the brave private key for pdfjs.
  // We maintain our own private keyask bcrypt or bbondy.
  PDFJSExtensionId: 'jdbefljfgobbmcidnmpjamcbhnbphjnb',
  PDFJSExtensionPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqmqh6Kxmj00IjKvjPsCtw6g2BHvKipjS3fBD0IInXZZ57u5oZfw6q42L7tgWDLrNDPvu3XDH0vpECr+IcgBjkM+w6+2VdTyPj5ubngTwvBqCIPItetpsZNJOJfrFw0OIgmyekZYsI+BsK7wiMtHczwfKSTi0JKgrwIRhHbEhpUnCxFhi+zI61p9jwMb2EBFwxru7MtpP21jG7pVznFeLV9W9BkNL1Th9QBvVs7GvZwtIIIniQkKtqT1wp4IY9/mDeM5SgggKakumCnT9D37ZxDnM2K13BKAXOkeH6JLGrZCl3aXmqDO9OhLwoch+LGb5IaXwOZyGnhdhm9MNA3hgEwIDAQAB',
  // Pocket
  // Download: https://clients2.google.com/service/update2/crx?response=redirect&prodversion=52.0.2743.116&x=id%3Dniloccemoadcdkdjlinkgdfekeahmflj%26uc // NOLINT
  PocketExtensionId: 'niloccemoadcdkdjlinkgdfekeahmflj',
  PocketExtensionPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKCQwBisK1UcxYMn6MAfDbc8yXWzvbnCzqJwjwbeMaAHji91jdCy3bEzMprTZxW/1Anfk9B4P+hcoTwqUaMUB4WemQMRKRsr9vC45V1iv912nqyGkoGT+cRKZc+niBriAnn4J2GBACHJqkkCiSChphDFt/UNoQEKz4VoqWZDVj/QIDAQAB',
  // Vimium
  // Download: https://clients2.google.com/service/update2/crx?response=redirect&prodversion=52.0.2743.116&x=id%3Ddbepggeogbaibhgnhhndojpepiihcmeb%26uc // NOLINT
  vimiumExtensionId: 'dbepggeogbaibhgnhhndojpepiihcmeb',
  vimiumExtensionPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCavizCZ9EnBGbtcRmMErcaxD2WUHJ9ME8IYGQhUBlFgIvchJjAO8koyak3AM95dqu3sOLdtIYD+75T82V1Wl5fLnHAeij2/IWL2VViTHeZhXZl1+rD9sRDaEYd7aZetpJ29+XXfhVphKArCCfwbYCtoJhTIr6S6DYsXuRevoV0EwIDAQAB',
  // Honey
  // Download: https://clients2.google.com/service/update2/crx?response=redirect&prodversion=52.0.2743.116&x=id%3Dbmnlcjabgnpnenekpadlanbbkooimhnj%26uc // NOLINT
  honeyExtensionId: 'bmnlcjabgnpnenekpadlanbbkooimhnj',
  honeyExtensionPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC79mayLyuCYY/dyT7Ycr1sVBp9yHrY4mnogVEgu+sDT6+/A121Na+aTw6mFLD6LHgbgHt4fnQ2V/QwcfBSXRTSkGpgNsZAjnYs4/XzZQYKGltWT93EP9zXN1kGbtzfkPGzTakquCfOjbKtbAQKWh8ppzqLhWcRUn9g/PhU99F29QIDAQAB',
  pinterestExtensionId: 'gpdjojdkbbmdfjfahjcgigfpmkopogic',
  pinterestExtensionPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDB95q2hyt49ZDuVnYI91XaZhqQkbXu0X3fzoNxPxhFbfqGKwtts90LJ7lD5DCIfnBg8WGFhp3eW4GxOglAKrnksmJoyAD5PnSAufx8fD3trZvo/ZAqFx1x5Xm3Rm34EgvVXdralgHSYiqcEU/FX3kYnLLhr2TS4lcrsn1KZd/lcQIDAQAB',
  coinbaseOrigin: 'https://buy.coinbase.com',
  newtab: {
    fallbackImage: {
      name: 'Bay Bridge',
      source: 'img/newtab_stock_image.jpg',
      author: 'Darrell Sano',
      link: 'https://dksfoto.smugmug.com'
    }
  },
  tabs: {
    maxAllowedNewSessions: 9
  },
  iconSize: 16,
  env,
  bravePort
}
