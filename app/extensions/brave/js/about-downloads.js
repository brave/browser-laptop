function initDownloadsListener (e) {
  window.initDownloads = e.detail.downloads
  window.removeEventListener('downloads-updated', initDownloadsListener)
}
window.addEventListener('downloads-updated', initDownloadsListener)
