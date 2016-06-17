/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function block3rdPartyStorage () {
  /**
   * Whether this is running in a third-party document.
   */
  function is3rdPartyDoc () {
    try {
      // Try accessing an element that cross-origin frames aren't supposed to
      window.top.document
    } catch (e) {
      if (e.name === 'SecurityError') {
        return true
      } else {
        console.log('got unexpected error accessing window.top.document', e)
        // Err on the safe side and assume this is a third-party frame
        return true
      }
    }
    return false
  }

  function blockStorage () {
    // Block js cookie storage
    Document.prototype.__defineGetter__('cookie', () => {return ""})
    Document.prototype.__defineSetter__('cookie', () => {})
    // Block referrer
    Document.prototype.__defineGetter__('referrer', () => {return ""})
    // Block websql
    window.openDatabase = () => { return {} }
    // Block FileSystem API
    window.webkitRequestFileSystem = () => { return {} }
    // Block indexeddb
    window.indexedDB.open = () => { return {} }
  }

  function blockReferer () {
    // Blocks cross-origin referer
    if (!document.referrer) {
      return
    }
    var parser = document.createElement('a')
    parser.href = document.referrer
    if (parser.origin !== document.location.origin) {
      Document.prototype.__defineGetter__('referrer', () => {return ""})
    }
  }

  function getBlockStoragePageScript (isThirdParty) {
    if (isThirdParty) {
      return '(' + Function.prototype.toString.call(blockStorage) + '());'
    } else {
      return '(' + Function.prototype.toString.call(blockReferer) + '());'
    }
  }

  function clearStorage () {
    // Clears HTML5 storage when the page is loaded/unloaded.
    window.localStorage.clear()
    window.sessionStorage.clear()
    // Clear IndexedDB
    var indexedDB = window.indexedDB
    indexedDB.webkitGetDatabaseNames().onsuccess = (sender) => {
      var dbs = sender.target.result
      for (var i = 0; i < dbs.length; i++) {
        // Delete each DB
        indexedDB.deleteDatabase(dbs[i])
      }
    }
  }

  if (is3rdPartyDoc()) {
    insertScript(getBlockStoragePageScript(true))
    clearStorage()
    window.addEventListener('unload', clearStorage)
  } else {
    insertScript(getBlockStoragePageScript(false))
  }
}
