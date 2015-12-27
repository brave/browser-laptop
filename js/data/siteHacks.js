module.exports = {
  'forbes.com': function(details) {
    details.requestHeaders.Cookie = details.requestHeaders.Cookie + `; forbes_ab=true; welcomeAd=true; adblock_session=Off; dailyWelcomeCookie=true`
    return details.requestHeaders
  }
}
