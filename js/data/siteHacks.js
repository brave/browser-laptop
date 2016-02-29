module.exports = {
  'forbes.com': {
    requestFilter: function(details) {
      return {
        customCookie: details.requestHeaders.Cookie + `; forbes_ab=true; welcomeAd=true; adblock_session=Off; dailyWelcomeCookie=true`
      }
    },
  },
  'www.cityam.com': {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36 Googlebot'
  }
}
