// disable experimental navigator.credentials
chrome.webFrame.setGlobal("navigator.credentials.get", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})

chrome.webFrame.setGlobal("navigator.credentials.store", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})

// disable battery status API
chrome.webFrame.setGlobal("navigator.getBattery", function () {
  return new Promise((resolve, reject) => {
    resolve({ charging: false, chargingTime: Infinity, dischargingTime: Infinity, level: 1, onchargingchange: null, onchargingtimechange: null, ondischargingtimechange: null, onlevelchange: null })
  })
})

if (chrome.contentSettings.doNotTrack == 'allow') {
  executeScript("window.Navigator.prototype.__defineGetter__('doNotTrack', () => { return 1 })")
}

if (chrome.contentSettings.ads == 'block') {
  chrome.webFrame.setGlobal("window.google_onload_fired", true)
}
