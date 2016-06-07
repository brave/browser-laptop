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
    console.log('blocking 3rd party storage mechanisms', window.location.href)
    // Block js cookie storage
    Document.prototype.__defineGetter__('cookie', () => {return ""})
    Document.prototype.__defineSetter__('cookie', () => {})
    // Block websql
    window.openDatabase = () => { return {} }
    // Block FileSystem API
    window.webkitRequestFileSystem = () => { return {} }
    // Block indexeddb
    window.indexedDB.open = () => { return {} }
  }

  function getBlockStoragePageScript () {
    return '(' + Function.prototype.toString.call(blockStorage) + '());'
  }

  function clearStorage () {
    // Clears HTML5 storage when the page is loaded/unloaded.
    console.log('clearing 3rd party storage', window.location.href)
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
    insertScript(getBlockStoragePageScript())
    clearStorage()
    window.addEventListener('unload', clearStorage)
  }
}
