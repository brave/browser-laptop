function initBookmarksListener (e) {
  window.initBookmarks = e.detail.bookmarks
  window.initBookmarkFolders = e.detail.bookmarkFolders
  window.removeEventListener('bookmarks-updated', initBookmarksListener)
}
window.addEventListener('bookmarks-updated', initBookmarksListener)
