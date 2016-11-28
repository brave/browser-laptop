(function () {
  let webtorrentEntryPage = 'gen/webtorrentPage.entry.js'

  var queryString = window.location.search
  var portMatch = queryString && queryString.match(/devServerPort=([0-9]+)/)
  var devServerPort
  if (portMatch) {
    devServerPort = portMatch[1]
  }

  let webtorrentEntryPage = 'gen/webtorrentPage.entry.js'
  if (devServerPort) {
    var baseHref = 'http://localhost:' + devServerPort
    webtorrentEntryPage = baseHref + '/' + webtorrentEntryPage
    var baseNode = document.createElement('base')
    baseNode.href = baseHref
    document.getElementsByTagName('head')[0].appendChild(baseNode)
  }

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
