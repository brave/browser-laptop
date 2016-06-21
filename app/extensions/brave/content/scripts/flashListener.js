/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Open flash links in the same tab so we can intercept them correctly
(function () {
  function replaceAdobeLinks () {
    Array.from(document.querySelectorAll('a[target="_blank"]')).forEach((elem) => {
      const href = elem.getAttribute('href')
      if (href &&
          (href.toLowerCase().includes('//get.adobe.com/flashplayer') ||
           href.toLowerCase().includes('//www.adobe.com/go/getflashplayer'))) {
        elem.setAttribute('target', '')
      }
    })
  }
  // Some pages insert the password form into the DOM after it's loaded
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        replaceAdobeLinks()
      }
    })
  })
  setTimeout(() => {
    replaceAdobeLinks()
    observer.observe(document.documentElement, {
      childList: true
    })
  }, 1000)
})()
