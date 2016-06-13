function initBraveryDefaultsListener (e) {
  window.initBraveryDefaults = e.detail
  window.removeEventListener('bravery-defaults-updated', initBraveryDefaultsListener)
}
window.addEventListener('bravery-defaults-updated', initBraveryDefaultsListener)
