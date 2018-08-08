// disable experimental navigator.credentials
chrome.webFrame.setGlobal("navigator.credentials.get", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})

chrome.webFrame.setGlobal("navigator.credentials.store", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})

// disable battery status API
chrome.webFrame.setGlobal("navigator.getBattery", function () {
  return new Promise((resolve, reject) => { reject(new Error('navigator.getBattery not supported.')) })
})

// bluetooth is not currently supported
executeScript("window.Navigator.prototype.__defineGetter__('bluetooth', () => { return undefined })")
// webusb also not supported yet
executeScript("window.Navigator.prototype.__defineGetter__('usb', () => { return undefined })")

if (chrome.contentSettings.doNotTrack == 'allow') {
  executeScript("window.Navigator.prototype.__defineGetter__('doNotTrack', () => { return 1 })")
}

if (chrome.contentSettings.ads == 'block') {
  chrome.webFrame.setGlobal("window.google_onload_fired", true)
}

// Spectre hotfix (https://github.com/brave/browser-laptop/issues/12570)
chrome.webFrame.setGlobal('window.SharedArrayBuffer', false)

if (chrome.contentSettings.mediaPermission == 'block') {
  // Needed for https://github.com/brave/browser-laptop/issues/14889
  // Note this is not necessary in non-Electron-based codebases since Chromium
  // automatically handles the permission for device enumeration.
  // Also: chromium doesn't have mediaPermission in content setting. It is actually
  // microphone && camera in chromium.
  executeScript("window.MediaDeviceInfo.prototype.__defineGetter__('label', () => { return '' })")
  executeScript("window.InputDeviceInfo.prototype.__defineGetter__('label', () => { return '' })")
}
