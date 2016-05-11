function initSettingsListener (e) {
  window.initSettings = e.detail
  window.removeEventListener('settings-updated', initSettingsListener)
}
function initSiteSettingsListener (e) {
  window.initSiteSettings = e.detail
  window.removeEventListener('site-settings-updated', initSiteSettingsListener)
}
window.addEventListener('settings-updated', initSettingsListener)
window.addEventListener('site-settings-updated', initSiteSettingsListener)
