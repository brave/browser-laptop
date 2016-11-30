(function () {
  var queryString = window.location.search
  var portMatch = queryString && queryString.match(/devServerPort=([0-9]+)/)
  var devServerPort
  if (portMatch) {
    devServerPort = portMatch[1]
  }

  let aboutEntryPage = 'gen/aboutPages.entry.js'
  if (devServerPort) {
    var baseHref = 'http://localhost:' + devServerPort
    aboutEntryPage = baseHref + '/' + aboutEntryPage
    var baseNode = document.createElement('base')
    baseNode.href = baseHref
    document.getElementsByTagName('head')[0].appendChild(baseNode)
  }

  var getFavicon = function(){
    var favicon = undefined;
    var nodeList = document.getElementsByTagName("link");
    for (var i = 0; i < nodeList.length; i++)
    {
      if((nodeList[i].getAttribute("rel") == "icon") || (nodeList[i].getAttribute("rel") == "shortcut icon"))
      {
        favicon = nodeList[i].getAttribute("href");
      }
    }
    return favicon;
  }

  // set favicon as a data url because chrome-extension urls don't work correctly
  if (getFavicon()) {
    var img = new Image();
    img.onload = function(){
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL();
        var docHead = document.getElementsByTagName('head')[0];
        var newLink = document.createElement('link');
        newLink.rel = 'shortcut icon';
        newLink.href = dataURL;
        docHead.appendChild(newLink);
        canvas = null;
    };
    img.src = 'img/favicon.ico';
  }
  chrome.ipcRenderer.on('language', (e, detail) => {
    document.l10n.requestLanguages([detail.langCode])
    document.getElementsByName('availableLanguages')[0].content = detail.languageCodes.join(', ')
  })
  window.addEventListener('load', function () {
    var po = document.createElement('script')
    po.async = true
    po.src = aboutEntryPage
    var s = document.getElementsByTagName('script')[0]
    s.parentNode.insertBefore(po, s)
    chrome.ipcRenderer.send('request-language')
  })
})()
