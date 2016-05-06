var queryString = window.location.href.split('?')[1]
var devServerPort = queryString.match(/devServerPort=([^&]*)/)[1]

let aboutEntryPage = 'gen/aboutPages.entry.js'
if (devServerPort) {
  aboutEntryPage = 'http://localhost:' + devServerPort + '/' + aboutEntryPage
}

window.addEventListener('language', function (evt) {
  document.l10n.requestLanguages([evt.detail.langCode])
  document.getElementsByName('availableLanguages')[0].content = evt.detail.languageCodes.join(', ')
  window.languageCodes = evt.detail.languageCodes
})

window.addEventListener('load', function () {
  var po = document.createElement('script')
  po.async = true
  po.src = aboutEntryPage
  var s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(po, s)
  window.dispatchEvent(new CustomEvent('request-language'))
})
