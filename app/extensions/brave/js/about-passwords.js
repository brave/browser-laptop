function initPasswordsListener (e) {
  window.initPasswords = e.detail
  window.removeEventListener('password-details-updated', initPasswordsListener)
}
function initPasswordsSiteListener (e) {
  window.initDisabledSites = e.detail
  window.removeEventListener('password-site-details-updated', initPasswordsSiteListener)
}
window.addEventListener('password-details-updated', initPasswordsListener)
window.addEventListener('password-site-details-updated', initPasswordsSiteListener)
