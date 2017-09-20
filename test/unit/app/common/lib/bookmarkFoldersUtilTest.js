/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const Immutable = require('immutable')
const assert = require('assert')
const bookmarkFoldersUtil = require('../../../../../app/common/lib/bookmarkFoldersUtil')
const siteTags = require('../../../../../js/constants/siteTags')

describe('bookmarkFoldersUtil unit test', function () {
  describe('isFolderNameValid', function () {
    it('null check', function () {
      const valid = bookmarkFoldersUtil.isFolderNameValid()
      assert.equal(valid, false)
    })

    it('title is an empty string', function () {
      const valid = bookmarkFoldersUtil.isFolderNameValid('')
      assert.equal(valid, false)
    })

    it('title is correct', function () {
      const valid = bookmarkFoldersUtil.isFolderNameValid('folder')
      assert.equal(valid, true)
    })
  })

  describe('getNextFolderId', function () {
    it('null check', function () {
      const id = bookmarkFoldersUtil.getNextFolderId()
      assert.equal(id, 0)
    })

    it('folders list is empty', function () {
      const id = bookmarkFoldersUtil.getNextFolderId(Immutable.List())
      assert.equal(id, 1)
    })

    it('folder list is ok', function () {
      const id = bookmarkFoldersUtil.getNextFolderId(Immutable.fromJS([
        { folderId: 0 },
        { folderId: 1 },
        { folderId: 2 }
      ]))
      assert.equal(id, 3)
    })
  })

  describe('getNextFolderName', function () {
    it('null check', function () {
      const name = bookmarkFoldersUtil.getNextFolderName(null, 'name')
      assert.equal(name, 'name')
    })

    it('name doesnt exist', function () {
      const name = bookmarkFoldersUtil.getNextFolderName(Immutable.fromJS([
        { title: 'name' },
        { title: 'name 1' },
        { title: 'name 2' }
      ]), 'name 3')
      assert.equal(name, 'name 3')
    })

    it('name already exist', function () {
      const name = bookmarkFoldersUtil.getNextFolderName(Immutable.fromJS([
        { title: 'name' },
        { title: 'newName' }
      ]), 'newName')
      assert.equal(name, 'newName (1)')
    })

    it('returns non first duplicate name from duplicate name', function () {
      const name = bookmarkFoldersUtil.getNextFolderName(Immutable.fromJS([
        { title: 'name' },
        { title: 'name (1)' }
      ]), 'name (1)')
      assert.equal(name, 'name (2)')
    })

    it('multiple names exist', function () {
      const name = bookmarkFoldersUtil.getNextFolderName(Immutable.fromJS([
        { title: 'name' },
        { title: 'newName' },
        { title: 'newName (1)' }
      ]), 'newName')
      assert.equal(name, 'newName (2)')
    })
  })

  describe('isFolder', function () {
    it('null check', function () {
      const valid = bookmarkFoldersUtil.isFolder()
      assert.equal(valid, false)
    })

    it('type is bookmark', function () {
      const valid = bookmarkFoldersUtil.isFolder(Immutable.fromJS({type: siteTags.BOOKMARK}))
      assert.equal(valid, false)
    })

    it('type is bookmark folder', function () {
      const valid = bookmarkFoldersUtil.isFolder(Immutable.fromJS({type: siteTags.BOOKMARK_FOLDER}))
      assert.equal(valid, true)
    })
  })

  describe('getKey', function () {
    it('null check', function () {
      const valid = bookmarkFoldersUtil.getKey()
      assert.equal(valid, null)
    })

    it('returns key if folderId matches', function () {
      const siteDetail = Immutable.fromJS({
        folderId: 1
      })
      const key = bookmarkFoldersUtil.getKey(siteDetail)
      assert.equal(key, 1)
    })

    it('returns null if folderId is missing', function () {
      const siteDetail = new Immutable.Map()
      const key = bookmarkFoldersUtil.getKey(siteDetail)
      assert.equal(key, null)
    })
  })

  describe('isMoveAllowed', function () {
    it('null check', function () {
      const valid = bookmarkFoldersUtil.isMoveAllowed()
      assert.equal(valid, false)
    })

    it('folder cant be its own parent', function () {
      const folder = Immutable.fromJS({
        parentFolderId: 0,
        folderId: 1
      })
      const valid = bookmarkFoldersUtil.isMoveAllowed(null, folder, folder)
      assert.equal(valid, false)
    })

    it('ancestor folder cant be moved into a descendant', function () {
      const source = Immutable.fromJS({
        parentFolderId: 0,
        folderId: 1
      })
      const destination = Immutable.fromJS({
        parentFolderId: 3,
        folderId: 4
      })
      const sites = Immutable.fromJS({
        '1': {
          parentFolderId: 0,
          folderId: 1
        },
        '2': {
          parentFolderId: 1,
          folderId: 2
        },
        '3': {
          parentFolderId: 2,
          folderId: 3
        },
        '4': {
          parentFolderId: 3,
          folderId: 4
        }
      })
      const valid = bookmarkFoldersUtil.isMoveAllowed(sites, source, destination)
      assert.equal(valid, false)
    })

    it('move is allow', function () {
      const source = Immutable.fromJS({
        parentFolderId: 0,
        folderId: 1
      })
      const destination = Immutable.fromJS({
        parentFolderId: 0,
        folderId: 2
      })
      const sites = Immutable.fromJS({
        '1': {
          parentFolderId: 0,
          folderId: 1
        },
        '2': {
          parentFolderId: 0,
          folderId: 2
        }
      })
      const valid = bookmarkFoldersUtil.isMoveAllowed(sites, source, destination)
      assert.equal(valid, true)
    })
  })
})
