/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (chrome.contentSettings.adInsertion == 'allow') {
  /**
   * Determines the ad size which should be shown
   * It will first check the node's size and try to infer that way.
   * If that is not possible it will rely on the iframeData
   *
   * @param node The node that is being replaced
   * @param iframeData The known preprocessed iframeData for that node
   */
  function getAdSize (node, iframeData) {
    const acceptableAdSizes = [
      [970, 250],
      [970, 90],
      [728, 90],
      [300, 250],
      [300, 600],
      [160, 600],
      [120, 600],
      [320, 50]
    ]
    for (let i = 0; i < acceptableAdSizes.length; i++) {
      const adSize = acceptableAdSizes[i]
      if (node.offsetWidth === adSize[0] && node.offsetHeight >= adSize[1] ||
          node.offsetWidth >= adSize[0] && node.offsetHeight === adSize[1]) {
        return adSize
      }
    }

    if (iframeData) {
      return [iframeData.width || iframeData.w, iframeData.height || iframeData.h]
    }

    return []
  }

  /**
   * Ensures a node replacement div is visible and has a proper zIndex
   */
  function ensureNodeVisible (node/*: Element*/)/* : void */ {
    if (document.defaultView.getComputedStyle(node).display === 'none') {
      node.setAttribute('style', 'display: ""')
    }
    if (document.defaultView.getComputedStyle(node).zIndex === '-1') {
      node.setAttribute('style', 'zIndex: ""')
    }
  }

  /**
   * Processes a single node which is an ad
   *
   * @param node The node of the ad to process
   * @param iframeData The iframe data of the node to process from the slimerJS bot
   * @param replacementUrl The vault replacement url
   */
  function processAdNode (node, iframeData, replacementUrl) {
    if (!node) {
      return
    }

    const adSize = getAdSize(node, iframeData)
    // Could not determine the ad size, so just skip this replacement
    if (!adSize.length) {
      // we have a replace node node but no replacement, so just display none on it
      node.style.display = 'none'
      return
    }

    // generate a random segment
    // @todo - replace with renko targeting
    const segments = ['IAB2', 'IAB17', 'IAB14', 'IAB21', 'IAB20']
    // TODO(riastradh): Can't use brave-crypto's random.uniform(n)
    // here because this is not node.  Use n*Math.random() because
    // this doesn't seem to be security-sensitive (if itis used at
    // all?).
    const segment = segments[Math.floor(segments.length * Math.random())]
    const time_in_segment = new Date().getSeconds()
    const segment_expiration_time = 0 // no expiration

    // ref param for referrer when possible
    const srcUrl = replacementUrl +
                  '?width=' + adSize[0] +
                  '&height=' + adSize[1] +
                  '&seg=' + segment + ':' + time_in_segment + ':' + segment_expiration_time

    const xhttp = new window.XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        const src = '<html><body style="width: ' + adSize[0] + 'px; height: ' + adSize[1] +
                            '; padding: 0; margin: 0; overflow: hidden;">' + xhttp.responseText + '</body></html>'
        const sandbox = 'allow-popups allow-popups-to-escape-sandbox'
        if (node.tagName === 'IFRAME') {
          node.setAttribute('srcdoc', src)
          node.setAttribute('sandbox', sandbox)
        } else {
          while (node.firstChild) {
            node.removeChild(node.firstChild)
          }
          const iframe = document.createElement('iframe')
          iframe.setAttribute('sandbox', sandbox)
          iframe.setAttribute('srcdoc', src)
          iframe.setAttribute('style',
                              'padding: 0; border: 0; margin: 0; width: ' + adSize[0] + 'px; ' + 'height: ' + adSize[1] + 'px;')
          node.appendChild(iframe)
          ensureNodeVisible(node)
          if (node.parentElement) {
            ensureNodeVisible(node.parentElement)
            if (node.parentNode.parentElement) {
              ensureNodeVisible(node.parentNode.parentElement)
            }
          }
        }
      }
    }
    xhttp.open('GET', srcUrl, true)
    xhttp.send()
  }

  function setAdDivCandidates(adDivCandidates, placeholderUrl) {
    let fallbackNodeDataForCommon = {}

    // Process all of the specific ad information for this page
    adDivCandidates.forEach(function (iframeData) {
      const replaceId = iframeData.replapceId || iframeData.rid
      const selector = '[id="' + replaceId + '"]'
      const node = document.querySelector(selector)
      if (!node) {
        return
      }

      // Skip over known common elements
      if (replaceId.startsWith('google_ads_iframe_') ||
          replaceId.endsWith('__container__')) {
        fallbackNodeDataForCommon[node.id] = iframeData
        return
      }

      // Find the node and process it
      processAdNode(document.querySelector(selector), iframeData, placeholderUrl)
    })

    // Common selectors which could be on every page
    const commonSelectors = [
      '[id^="google_ads_iframe_"][id$="__container__"]',
      '[id^="ad-slot-banner-"]',
      '[data-ad-slot]'
    ]
    commonSelectors.forEach((commonSelector) => {
      const nodes = document.querySelectorAll(commonSelector)
      if (!nodes) {
        return
      }
      Array.from(nodes).forEach((node) => {
        processAdNode(node, fallbackNodeDataForCommon[node.id], placeholderUrl)
      })
    })
  }

  let host = document.location.hostname
  if (host) {
    host = host.replace(/^www\./, '')
    chrome.ipcRenderer.on('set-ad-div-candidates', (e, divHost, adDivCandidates, placeholderUrl) => {
      // don't accidentally intercept messages not intended for this host
      if (host === divHost) {
        setAdDivCandidates(adDivCandidates, placeholderUrl)
      }
    })
    chrome.ipcRenderer.send('get-ad-div-candidates', host)
  }
}
