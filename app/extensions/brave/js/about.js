window.addEventListener('language', function (evt) {
  document.l10n.requestLanguages([evt.detail.langCode])
  document.getElementsByName('availableLanguages')[0].content = evt.detail.languageCodes.join(', ')
  window.languageCodes = evt.detail.languageCodes
})

window.addEventListener('load', function () {
  var po = document.createElement('script')
  po.async = true
  po.src = 'gen/aboutPages.entry.js'
  var s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(po, s)
  window.dispatchEvent(new CustomEvent('request-language'))
})
