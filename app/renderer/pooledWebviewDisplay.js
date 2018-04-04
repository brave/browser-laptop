/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const remote = require('electron').remote
const {
  getTargetAboutUrl,
  getBaseUrl
} = require('../../js/lib/appUrlUtil')
const debounce = require('../../js/lib/debounce')

let i = 0

function ensurePaintWebviewFirstAttach (webview, cb = () => {}) {
  window.requestAnimationFrame(() => {
    webview.style.display = 'none'
    window.requestAnimationFrame(() => {
      webview.style.display = ''
      window.requestAnimationFrame(cb)
    })
  })
}

function ensurePaintWebviewSubsequentAttach (webview, cb = () => {}) {
  webview.style.top = '1px'
  window.requestAnimationFrame(() => {
    webview.style.top = ''
    cb()
  })
}

const animationFrame = () => new Promise(window.requestAnimationFrame)

module.exports = class WebviewDisplay {
  constructor ({ containerElement, classNameWebview, classNameWebviewAttached, classNameWebviewAttaching, onFocus, onZoomChange, shouldRemoveOnDestroy = false }) {
    if (!containerElement) {
      throw new Error('Must pass a valid containerElement to WebviewDisplay constructor')
    }
    this.shouldLogEvents = false
    this.shouldRemoveOnDestroy = shouldRemoveOnDestroy
    this.containerElement = containerElement
    this.classNameWebview = classNameWebview
    this.classNameWebviewAttached = classNameWebviewAttached
    this.classNameWebviewAttaching = classNameWebviewAttaching
    this.onFocus = onFocus || (() => {})
    this.onZoomChange = onZoomChange || (() => {})
    this.webviewPool = []
    // when contents are destroyed, don't remove the webview immediately,
    // wait for a potential new view to be displayed before removing.
    // Ensures a smooth transition with no 'white flash'
    this.webviewsPendingRemoval = []
    this.attachedWebview = null
    this.ensureWebviewPoolSize()
  }

  debugLog (...messages) {
    if (this.shouldLogEvents) {
      console.log('%cWebviewDisplay', 'color: #ccc', ...messages)
    }
  }

  ensureWebviewPoolSize () {
    // There should be 1 in the pool and 1 attached,
    // or 2 in the pool.
    let requiredPoolSize = this.attachedWebview ? 1 : 2
    const poolDeficit = requiredPoolSize - this.webviewPool.length
    this.debugLog(`Adding ${poolDeficit} webview(s)`)
    for (let i = 0; i < poolDeficit; i++) {
      this.addPooledWebview()
    }
  }

  addPooledWebview () {
    const newWebview = this.createPooledWebview()
    newWebview.dataset.webviewReplaceCount = i++
    this.webviewPool.push(newWebview)
    this.containerElement.appendChild(newWebview)
  }

  getPooledWebview () {
    this.ensureWebviewPoolSize()
    return this.webviewPool.pop()
  }

  createPooledWebview () {
    this.debugLog('creating a webview')
    const webview = document.createElement('webview')
    webview.classList.add(this.classNameWebview)
    if (this.onFocus) {
      webview.addEventListener('focus', this.onFocus)
    }
    // support focusing on active tab when navigation complete
    webview.addEventListener('did-navigate', (e) => {
      // do not steal focus if is new tab page, or if we're about to
      // switch away
      const isNewTabPage = getBaseUrl(e.url) === getTargetAboutUrl('about:newtab')
      const isSwitchingAway = this.attachingToGuestInstanceId && this.attachingToGuestInstanceId !== this.activeGuestInstanceId
      if (!isNewTabPage && !isSwitchingAway) {
        webview.focus()
      }
    })
    let wheelDeltaY
    const performZoom = debounce(() => {
      if (wheelDeltaY > 0) {
        webview.zoomIn()
        this.onZoomChange(webview.getZoomPercent())
      } else if (wheelDeltaY < 0) {
        webview.zoomOut()
        this.onZoomChange(webview.getZoomPercent())
      }
      wheelDeltaY = 0
    }, 20)
    webview.addEventListener('mousewheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        wheelDeltaY = (wheelDeltaY || 0) + e.wheelDeltaY
        performZoom()
      } else {
        wheelDeltaY = 0
      }
    })
    webview.addEventListener('tab-id-changed', (e) => {
      this.debugLog('webview tab-id-changed to tabId', e.tabID)
    })
    webview.addEventListener('tab-detached-at', () => {
      this.debugLog('webview tab-detached-at')
      webview.detachGuest()
    })
    const debugEvents = ['tab-replaced-at', 'tab-id-changed', 'will-attach', 'did-attach', 'did-detach', 'will-detach', 'console-message']
    for (const event of debugEvents) {
      webview.addEventListener(event, () => {
        this.debugLog(`<webview> event ${event}`, webview)
      })
    }
    return webview
  }

  attachActiveTab (tabId) {
    this.debugLog(`attachActiveTab`, tabId)
    if (tabId == null) {
      throw new Error('guestInstanceId is not valid')
    }
    // do nothing if repeat call to same guest Id as attached or attaching
    if (
      (!this.attachingToGuestInstanceId && tabId === this.activeGuestInstanceId) ||
      tabId === this.attachingToGuestInstanceId
    ) {
      this.debugLog('already attaching this guest, nothing to do.')
      return
    }
    // are we waiting to attach to something different already?
    if (this.attachingToGuestInstanceId != null) {
      // wait for that attach to finish, and queue this one up to then display
      // if we have something already in the queue, then remove it
      this.debugLog('attach already in progress, queuing replacement guest')
      this.attachingToGuestInstanceId = tabId
      return
    }
    // fresh attach
    this.swapWebviewOnAttach(tabId, this.getPooledWebview(), this.attachedWebview)
  }

  swapWebviewOnAttach (tabId, toAttachWebview, lastAttachedWebview) {
    if (this.shouldLogEvents) {
      console.group(`swapWebviewOnAttach: attach ${tabId}`)
    }
    this.debugLog(`swapWebviewOnAttach: Using webview #${toAttachWebview.dataset.webviewReplaceCount}`)

    this.attachingToGuestInstanceId = tabId
    const t0 = window.performance.now()
    let timeoutHandleBumpView = null
    const fnEnd = () => {
      if (this.shouldLogEvents) {
        console.groupEnd()
      }
    }
    // fn for guest did attach, and workaround to force paint
    const onToAttachDidAttach = () => {
      this.debugLog(`swapWebviewOnAttach: webview did-attach ${window.performance.now() - t0}ms`)
      // TODO(petemill) remove ugly workaround as <webview>
      // will often not paint guest unless
      // size has changed or forced to.
      if (!toAttachWebview.isSubsequentAttach) {
        toAttachWebview.isSubsequentAttach = true
        ensurePaintWebviewFirstAttach(toAttachWebview, showAttachedView)
      } else {
        ensurePaintWebviewSubsequentAttach(toAttachWebview, showAttachedView)
      }
    }

    // fn for smoothly hiding the previously active view before showing this one
    const showAttachedView = async () => {
      // if we have decided to show a different guest in the time it's taken to attach and show
      // then do not show the intermediate, instead detach it and wait for the next attach
      if (tabId !== this.attachingToGuestInstanceId) {
        this.debugLog('swapWebviewOnAttach: detaching guest from just attached view because it was not the desired guest anymore')
        remote.unregisterEvents(tabId, tabEventHandler)
        await toAttachWebview.detachGuest()
        // if it happens to be the webview which is already being shown
        if (this.attachingToGuestInstanceId === this.activeGuestInstanceId) {
          // release everything and do not continue
          this.webviewPool.push(toAttachWebview)
          this.attachingToGuestInstanceId = null
          this.debugLog('swapWebviewOnAttach: Asked to show already-attached view, so leaving that alone and returning new attached to pool')
          fnEnd()
          return
        }
        // start again, but with different guest
        this.debugLog('swapWebviewOnAttach: Asked to show a different guest than the one we just attached, continuing with that one')
        fnEnd()
        this.swapWebviewOnAttach(this.attachingToGuestInstanceId, toAttachWebview, lastAttachedWebview)
        return
      }
      this.debugLog(`swapWebviewOnAttach: webview waiting for paint ${window.performance.now() - t0}ms`)

      // At the point where we are attached to the guest we *still* want to be displaying.
      // So, show it.
      toAttachWebview.classList.add(this.classNameWebviewAttaching)
      // (takes about 3 frames to paint fully and avoid a white flash)
      await animationFrame()
      await animationFrame()
      await animationFrame()
      this.debugLog('swapWebviewOnAttach: unregisterEvents', tabId)
      remote.unregisterEvents(tabId, tabEventHandler)
      this.debugLog(`swapWebviewOnAttach: webview finished waiting for paint, showing... ${window.performance.now() - t0}ms`)
      toAttachWebview.classList.add(this.classNameWebviewAttached)
      // If we are already showing another frame, we wait for this new frame to display before
      // hiding (and removing) the other frame's webview, so that we avoid a white flicker
      // between attach.
      if (lastAttachedWebview) {
        // finalize display classes
        lastAttachedWebview.classList.remove(this.classNameWebviewAttached)
        toAttachWebview.classList.remove(this.classNameWebviewAttaching)
        this.debugLog('swapWebviewOnAttach: detaching guest from last attached webview...')
        // TODO: don't neccessarily need to do this, since next attach should detach guest
        await lastAttachedWebview.detachGuest()
        // return to the pool,
        this.webviewPool.push(lastAttachedWebview)
      }
      // check again if there's a pending view
      // since we may have done something async
      const pendingGuestInstanceId = this.attachingToGuestInstanceId
      // reset state
      this.activeGuestInstanceId = tabId
      this.attachedWebview = toAttachWebview
      this.attachingToGuestInstanceId = null
      // perform next attach if there's one waiting
      if (pendingGuestInstanceId !== tabId) {
        this.debugLog('swapWebviewOnAttach - another attach pending, continuing with that attach request')
        fnEnd()
        this.swapWebviewOnAttach(pendingGuestInstanceId, this.getPooledWebview(), this.attachedWebview)
      } else {
        if (this.shouldFocusOnAttach) {
          this.shouldFocusOnAttach = false
          toAttachWebview.focus()
        }
        fnEnd()
      }
    }

    // we may get a will-destroy before a did-attach, if that happens, abandon
    const onDestroyedInsteadOfAttached = () => {
      this.debugLog('swapWebviewOnAttach: destroyed instead of attached...')
      // continue with next attach request if we've had one in the meantime
      if (this.attachingToGuestInstanceId !== tabId) {
        // if it happens to be the webview which is already being shown
        if (this.attachingToGuestInstanceId === this.activeGuestInstanceId) {
          // release everything and do not continue
          this.webviewPool.push(toAttachWebview)
          this.attachingToGuestInstanceId = null
          this.debugLog('swapWebviewOnAttach: Asked to show already-attached view, so leaving that alone and returning new attached to pool')
          fnEnd()
          return
        }
        // start again, but with different guest
        this.debugLog('swapWebviewOnAttach: Asked to show a different guest than the one we just attached, continuing with that one')
        fnEnd()
        this.swapWebviewOnAttach(this.attachingToGuestInstanceId, toAttachWebview, lastAttachedWebview)
        return
      }
      // reset state and do not continue
      this.webviewPool.push(toAttachWebview)
      this.attachingToGuestInstanceId = null
      fnEnd()
    }

    // monitor for destroy or attach after we ask for attach
    this.debugLog('swapWebviewOnAttach: getting web contents for', tabId, '...')
    let handled = false
    const tabEventHandler = (event) => {
      this.debugLog('pooled got event for tab', tabId, event.type)
      switch (event.type) {
        case 'will-destroy':
        case 'destroyed':
          // don't need to bump view
          clearTimeout(timeoutHandleBumpView)
          remote.unregisterEvents(tabId, tabEventHandler)
          onDestroyedInsteadOfAttached()
          break
        case 'did-attach':
          // only handle once,
          // tab can attach, detach and attach again for some reason
          // but we don't remove handler here as we want to know
          // when did-detach happens after did-attach but before
          // we're done displaying
          if (!handled) {
            // don't need to bump view
            clearTimeout(timeoutHandleBumpView)
            onToAttachDidAttach()
            handled = true
          }
          break
        case 'did-detach':
          // we want to know if the tab has detached before we're done
          if (this.shouldLogEvents) {
            console.warn('swapWebviewOnAttach: webview detached during/after attach!')
          }
          break
      }
    }

    remote.registerEvents(tabId, tabEventHandler)

    // check if the contents are already destroyed before we attach
    remote.getWebContents(tabId, (webContents) => {
      if (!webContents || webContents.isDestroyed()) {
        onDestroyedInsteadOfAttached()
        remote.unregisterEvents(tabId, tabEventHandler)
        return
      }
      // use the guest instance id
      const guestInstanceId = webContents.guestInstanceId
      this.debugLog('swapWebviewOnAttach: attaching active guest instance ', guestInstanceId, 'to webview', toAttachWebview)
      // setImmediate is a bit of a hacky way to ensure that registerEvents handler is registered
      setImmediate(() => toAttachWebview.attachGuest(guestInstanceId, webContents))
      this.debugLog('swapWebviewOnAttach: Waiting....')
      // another workaround for not getting did-attach on webview, set a timeout and then hide / show view
      timeoutHandleBumpView = window.setTimeout(ensurePaintWebviewFirstAttach.bind(null, toAttachWebview), 2000)
    })
  }

  getActiveWebview () {
    return this.attachedWebview
  }

  focusActiveWebview () {
    if (!this.attachingToGuestInstanceId && this.attachedWebview) {
      this.attachedWebview.focus()
    } else if (this.attachingToGuestInstanceId) {
      this.shouldFocusOnAttach = true
    }
  }

  removePendingWebviews () {
    if (this.webviewsPendingRemoval.length) {
      const webviewsToRemove = this.webviewsPendingRemoval
      this.webviewsPendingRemoval = []
      for (const webview of webviewsToRemove) {
        if (!webview) {
          continue
        }
        // just in case... (don't want to remove a webview with contents still attached
        // since the contents will be destroyed)
        webview.detachGuest()
        // remove from DOM and allow garbage collection / event removal
        webview.remove()
      }
    }
  }
}
