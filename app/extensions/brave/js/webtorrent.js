(function () {
  let webtorrentEntryPage = 'gen/webtorrentPage.entry.js'

  chrome.ipc.on('language', (e, detail) => {
    document.l10n.requestLanguages([detail.langCode])
    document.getElementsByName('availableLanguages')[0].content = detail.languageCodes.join(', ')
  })

  window.addEventListener('load', function () {
    var po = document.createElement('script')
    po.async = true
    po.src = webtorrentEntryPage
    var s = document.getElementsByTagName('script')[0]
    s.parentNode.insertBefore(po, s)
    chrome.ipc.send('request-language')
  })
})()
