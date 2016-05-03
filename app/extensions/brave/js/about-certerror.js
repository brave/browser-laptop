function initCertDetailsListener (e) {
  window.initCertDetails = e.detail
  window.removeEventListener('cert-details-updated', initCertDetailsListener)
}
window.addEventListener('cert-details-updated', initCertDetailsListener)
