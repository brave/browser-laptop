module.exports = {
  'forbes.com': {
    onBeforeSendHeaders: function(details) {
      return {
        customCookie: details.requestHeaders.Cookie + `; forbes_ab=true; welcomeAd=true; adblock_session=Off; dailyWelcomeCookie=true`
      }
    },
  },
  'www.cityam.com': {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36 Googlebot'
  },
  'player.twitch.tv': {
    allowRunningInsecureContent: true,
    onBeforeRequest: function(details) {
      if (details.resourceType !== 'subFrame' && details.resourceType !== 'mainFrame' || details.url.includes('&html5')) {
        return
      }
      return {
        redirectURL: details.url + '&html5'
      }
    }
  },
  'www.wired.com': {
    // Site hack from
    // https://github.com/gorhill/uBlock/blob/ce2d235e4fd2ade2be101fa7030870044b30fd3c/assets/ublock/resources.txt#L699
    pageLoadEndScript: `(function() {
      var sto = window.setTimeout,
        re = /^function n\(\)/;
      window.setTimeout = function(a, b) {
          if ( b !== 50 || !re.test(a.toString()) ) {
                sto(a, b);
              }
        };
    })();`
  },
  'www.twitch.tv': {
    allowRunningInsecureContent: true,
    pageLoadEndScript: `$('.js-player').html(
      $('<iframe>').attr({
        src: 'https://player.twitch.tv/?branding=false&html5&showInfo=false&channel=' + $(location).attr('pathname'),
        width: '100%',
        height: '100%',
        allowfullscreen: true,
        webkitallowfullscreen: true
      }).css('border', 0)
    );
    $('.player-overlay, .player-loading').hide();`
  }
}
