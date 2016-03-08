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
    onBeforeRequest: function(details) {
      console.log('onBeforeRequest player.twitch.tv', details)
      if (details.resourceType !== 'subFrame' || details.url.includes('&html5')) {
        return
      }
      console.log('details for player.twitch.tv', details)
      return {
        redirectURL: details.url + '&html5'
      }
    }
  },
  'www.twitch.tv': {
    pageLoadEndScript: `$('.js-player').html(
      $('<iframe>').attr({
        src: 'http://player.twitch.tv/?branding=false&html5&showInfo=false&channel=' + $(location).attr('pathname'),
        width: '100%',
        height: '100%',
        allowfullscreen: true,
        webkitallowfullscreen: true
      }).css('border', 0)
    );
    $('.player-overlay, .player-loading').hide();`
  }
}
