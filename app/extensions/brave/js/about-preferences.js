function initSettingsListener (e) {
  window.initSettings = e.detail
  window.removeEventListener('settings-updated', initSettingsListener)
}
function initSiteSettingsListener (e) {
  window.initSiteSettings = e.detail
  window.removeEventListener('site-settings-updated', initSiteSettingsListener)
}
function initBraveryDefaultsListener (e) {
  window.initBraveryDefaults = e.detail
  window.removeEventListener('bravery-defaults-updated', initBraveryDefaultsListener)
}
window.addEventListener('settings-updated', initSettingsListener)
window.addEventListener('site-settings-updated', initSiteSettingsListener)
window.addEventListener('bravery-defaults-updated', initBraveryDefaultsListener)
