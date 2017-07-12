const Immutable = require('immutable')
const siteTags = require('../../../js/constants/siteTags')
const bookmarkFoldersUtil = require('../lib/bookmarkFoldersUtil')

const setOrder = (cache, key, tag, destinationKey, append = true) => {
  let newCache = Immutable.List()
  let i = 0

  for (let item of cache) {
    if (item.get('key') === destinationKey) {
      if (append) {
        newCache = newCache.push(item.set('order', i))
        i++
        newCache = newCache.push(Immutable.fromJS({
          key: key,
          order: i,
          type: tag
        }))
      } else {
        newCache = newCache.push(Immutable.fromJS({
          key: key,
          order: i,
          type: tag
        }))
        i++
        newCache = newCache.push(item.set('order', i))
      }
    } else if (item.get('key') === key) {
      continue
    } else {
      newCache = newCache.push(item.set('order', i))
    }
    i++
  }

  return newCache
}

const addCacheItem = (state, parentId = 0, key, destinationKey, tag, append) => {
  parentId = parentId.toString()
  key = key.toString()
  // cache with this parentId doesn't exist yet
  if (!state.hasIn(['cache', 'bookmarkOrder', parentId])) {
    return state.setIn(['cache', 'bookmarkOrder', parentId], Immutable.fromJS([
      {
        key: key,
        order: 0,
        type: tag
      }
    ]))
  }

  const cache = state.getIn(['cache', 'bookmarkOrder', parentId])
  // destination key is not provided
  if (destinationKey == null) {
    return state.setIn(['cache', 'bookmarkOrder', parentId], cache.push(Immutable.fromJS(
      {
        key: key,
        order: cache.size,
        type: tag
      }
    )))
  }

  // destination key is given
  const newCache = setOrder(cache, key, tag, destinationKey, append)
  return state.setIn(['cache', 'bookmarkOrder', parentId], newCache)
}

const addBookmarkToCache = (state, parentId, key, destinationKey, append) => {
  return addCacheItem(state, parentId, key, destinationKey, siteTags.BOOKMARK, append)
}

const addFolderToCache = (state, parentId, key, destinationKey, append) => {
  return addCacheItem(state, parentId, key, destinationKey, siteTags.BOOKMARK_FOLDER, append)
}

const getFoldersByParentId = (state, parentId) => {
  return state.getIn(['cache', 'bookmarkOrder', parentId.toString()], Immutable.List())
    .filter(item => bookmarkFoldersUtil.isFolder(item))
}

const getBookmarksByParentId = (state, parentId = 0) => {
  return state.getIn(['cache', 'bookmarkOrder', parentId.toString()], Immutable.List())
    .filter(item => bookmarkFoldersUtil.isFolder(item))
}

const getBookmarksWithFolders = (state, parentId) => {
  return state.getIn(['cache', 'bookmarkOrder', parentId.toString()], Immutable.List())
}

const removeCacheKey = (state, parentId, key) => {
  parentId = parentId.toString()
  key = key.toString()
  const cache = state.getIn(['cache', 'bookmarkOrder', parentId])

  if (cache == null) {
    return state
  }

  let newCache = Immutable.List()
  let i = 0

  for (let item of cache) {
    if (item.get('key') !== key) {
      newCache = newCache.push(item.set('order', i))
      i++
    }
  }

  return state.setIn(['cache', 'bookmarkOrder', parentId], newCache)
}

const removeCacheParent = (state, parentId) => {
  return state.deleteIn(['cache', 'bookmarkOrder', parentId.toString()])
}

const getOrderCache = (state) => {
  return state.getIn(['cache', 'bookmarkOrder'], Immutable.Map())
}

module.exports = {
  addBookmarkToCache,
  addFolderToCache,
  removeCacheKey,
  getFoldersByParentId,
  getBookmarksByParentId,
  getBookmarksWithFolders,
  removeCacheParent,
  getOrderCache
}
