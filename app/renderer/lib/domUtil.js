module.exports.createWebView = () => {
  return document.createElement('webview')
}

module.exports.appendChild = (element, child) => {
  element.appendChild(child)
}
