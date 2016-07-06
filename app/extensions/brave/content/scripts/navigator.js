// disable experimental navigator.credentials
chrome.webFrame.setGlobal("navigator.credentials.get", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})

chrome.webFrame.setGlobal("navigator.credentials.store", function () {
  return new Promise((resolve, reject) => { resolve(false) })
})
