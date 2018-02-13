const ipc = chrome.ipcRenderer

ipc.send('got-background-page-webcontents')

ipc.on('fetch-publisher-info', (e, url, options) => {
  let finalUrl = url
  window.fetch(url, options).then((response) => {
    finalUrl = response.url
    return response.text()
  }).then((text) => {
    const parser = new DOMParser()
    const html = parser.parseFromString(text, 'text/html')
    ipc.send('got-publisher-info-' + url, {
      error: null,
      url: finalUrl,
      title: html.title,
      image: html.querySelector('meta[property="og:image:secure_url"],meta[property="og:image:url"],meta[property="og:image"],meta[name="twitter:image:src"],meta[name="twitter:image"]').content
    })
  }).catch((err) => {
    console.log('fetch error', err)
    ipc.send('got-publisher-info-' + url, {
      url: finalUrl,
      error: err.message
    })
  })
})
