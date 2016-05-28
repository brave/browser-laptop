(function () {
  var queryString = window.location.search
  var devServerPort = queryString && queryString.match(/devServerPort=([^&]*)/)[1]

  let aboutEntryPage = 'gen/aboutPages.entry.js'
  if (devServerPort) {
    aboutEntryPage = 'http://localhost:' + devServerPort + '/' + aboutEntryPage
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

  var stateUpdateListener = function (e) {
    window.removeEventListener('state-updated', stateUpdateListener)
    window.aboutDetails = e.detail
  }
  window.addEventListener('state-updated', stateUpdateListener)


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
})()
