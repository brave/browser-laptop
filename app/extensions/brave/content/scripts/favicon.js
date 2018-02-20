const getBase64FromImageUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onerror = function () {
      reject(new Error('unable to load image'))
    }
    img.onload = function () {
      const canvas = document.createElement('canvas')
      canvas.width = this.naturalWidth
      canvas.height = this.naturalHeight
      canvas.getContext('2d')
        .drawImage(this, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = url
  })
}

let faviconUrl = window.location.origin + '/favicon.ico'
const faviconNode = document.head.querySelector("link[rel='icon']") || document.head.querySelector("link[rel='shortcut icon']")
if (faviconNode) {
  faviconUrl = faviconNode.getAttribute('href') || faviconUrl
}

getBase64FromImageUrl(faviconUrl).then((data) => {
  chrome.ipcRenderer.sendToHost('got-page-favicon', data)
})
