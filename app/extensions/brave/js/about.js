var queryString = window.location.href.split('?')[1]
var devServerPort = queryString.match(/devServerPort=([^&]*)/)[1]

let aboutEntryPage = 'gen/aboutPages.entry.js'
if (devServerPort) {
  aboutEntryPage = 'http://localhost:' + devServerPort + '/' + aboutEntryPage
}

window.addEventListener('load', function () {
  var po = document.createElement('script')
  po.async = true
  po.src = aboutEntryPage
  var s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(po, s)
})
