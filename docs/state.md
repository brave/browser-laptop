# Overview

All application state is managed by a top level [ImmutableJS](http://facebook.github.io/immutable-js/) object.
Child components should not modify top level state directly, instead they should call into an action which will dispatch a message to the store to make any such changes.

# Hierarchy

AppStore

```javascript
{
  sites: [{
    location: string,
    title: string,
    tags: [string], // empty, 'bookmark', 'bookmark-folder', 'pinned', or 'reader'
    favicon: string, // URL of the favicon
    lastAccessedTime: number, // datetime.getTime()
    partitionNumber: number, // Optionally specifies a specific session
    folderId: number, // Set for bookmark folders only
    parentFolderId: number // Set for bookmarks and bookmark folders only
  }],
  downloads: [{
    [downloadId]: {
      startTime: number, // datetime.getTime()
      filename: string,
      savePath: string,
      url: string,
      totalBytes: Number,
      receivedBytes: Number,
      state: string // One of: 'pending', 'in-progress', 'completed', 'cancelled', 'interrupted'
    }
  }],
  siteSettings: {
    [hostPattern]: {
      zoomLevel: number,
      mediaPermission: boolean,
      geolocationPermission: boolean,
      notificationsPermission: boolean,
      midiSysexPermission: boolean,
      pointerLockPermission: boolean,
      fullscreenPermission: boolean,
      openExternalPermission: boolean,
      protocolRegistrationPermission: boolean,
      savePasswords: boolean, // Only false or undefined/null
      shieldsUp: boolean,
      adControl: string, // (showBraveAds | blockAds | allowAdsAndTracking)
      cookieControl: string, // (block3rdPartyCookie | allowAllCookies)
      safeBrowsing: boolean,
      noScript: boolean,
      httpsEverywhere: boolean,
      fingerprintingProtection: boolean,
      flash: (number|boolean), // approval expiration time if allowed, false if never allow
      ledgerPayments: boolean // False if site should not be paid by the ledger. Defaults to true.
    }
  },
  temporarySiteSettings: {
    // Same as above but never gets written to disk
  },
  visits: [{
    location: string,
    startTime: number, // datetime.getTime()
    endTime: number // datetime.getTime()
  }],
  passwords: [{
    origin: string, // origin of the form
    action: string, // URL of the form action
    username: string,
    encryptedPassword: string, // encrypted by master password, binary-encoded
    authTag: string, // AES-GCM authentication data, binary-encoded
    iv: string // AES-GCM initialization vector, binary-encoded
  }],
  adblock: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: string, // last checked data file version
    lastCheckDate: number, // last checked data file date.getTime()
    enabled: boolean // Enable adblocking
  },
  safeBrowsing: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: string, // last checked data file version
    lastCheckDate: number, // last checked data file date.getTime()
    enabled: boolean // Enable adblocking
  },
  trackingProtection: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: string, // last checked data file version
    lastCheckDate: number, // last checked data file date.getTime()
    enabled: boolean // Enable tracking protection
  },
  httpsEverywhere: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: string, // last checked data file version
    lastCheckDate: number, // last checked data file date.getTime()
    enabled: boolean // Enable HTTPS Everywhere
  },
  adInsertion: {
    enabled: boolean // Enable ad insertion
  },
  cookieblock: {
    enabled: boolean // Enable 3p cookie/referer blocking
  },
  noScript: {
    enabled: boolean // Enable noscript
  },
  flash: {
    enabled: boolean // Enable flash
  },
  defaultWindowHeight: number,
  defaultWindowWidth: number,
  updates: {
    status: string, // UpdateStatus from js/constants/updateStatus.js
    metadata: {
      name: string, // Name of the update
      notes: string, // Release notes for the active update
    },
    verbose: boolean, // Whether to show update UI for checking, downloading, and errors
    lastCheckTimestamp: boolean
  },
  notifications: [{
    message: string,
    buttons: Array<string>,
    frameOrigin: (string|undefined), // origin that the notification is from, or undefined if not applicable.
    options: {
      persist: boolean, // whether to show a 'Remember this decision' checkbox
      advancedText: string, // more info text
      advancedLink: string, // more info link URL
    }
  }], // the notifications for the frame. not preserved across restart.
  settings: [{
    // See defaults in js/constants/appConfig.js
    'general.startup-mode': string, // One of: lastTime, homePage, newTabPage
    'general.homepage': string, // URL of the user's homepage
    'general.show-home-button': boolean, // true if the home button should be shown
    'general.useragent.value': (undefined|string), // custom user agent value
    'general.downloads.default-save-path': string, // default path for saving files
    'general.autohide-menu': boolean, // true if the Windows menu should be autohidden
    'general.disable-title-mode': boolean, // true if title mode should always be disabled
    'search.default-search-engine': string, // name of search engine, from js/data/searchProviders.js
    'search.offer-search-suggestions': boolean, // true if suggestions should be offered from the default search engine when available.
    'tabs.switch-to-new-tabs': boolean, // true if newly opened tabs should be focused immediately
    'tabs.paint-tabs': boolean, // true if the page theme color and favicon color should be used for tabs
    'tabs.tabs-per-page': number, // Number of tabs per tab page
    'tabs.show-tab-previews': boolean, // True to show tab previews
    'privacy.history-suggestions': boolean, // Auto suggest for history enabled
    'privacy.bookmark-suggestions': boolean, // Auto suggest for bookmarks enabled
    'privacy.opened-tab-suggestions': boolean, // Auto suggest for opened tabs enabled
    'privacy.autocomplete.history-size': number, // Number of autocomplete entries to keep
    'privacy.do-not-track': boolean, // whether DNT is 1
    'privacy.block-canvas-fingerprinting': boolean, // Canvas fingerprinting defense
    'security.passwords.manager-enabled': boolean, // whether to use default password manager
    'security.passwords.one-password-enabled': boolean, // true if the 1Password extension should be enabled
    'security.passwords.dashlane-enabled': boolean, // true if the Dashlane extension should be enabled
    'bookmarks.toolbar.show': boolean, // true if the bookmakrs toolbar should be shown
    'bookmarks.toolbar.showFavicon': boolean, // true if bookmark favicons should be shown on the bookmarks toolbar
    'bookmarks.toolbar.showOnlyFavicon': boolean, // true if only favicons should be shown on the bookmarks toolbar
    'general.language': string, // The language code to use for localization and spell check or null to use the system default
    'payments.enabled': boolean, // true if the Payments pane is active
    'payments.contribution-amount': number, // in USD
    'advanced.hardware-acceleration-enabled': boolean, // false if hardware acceleration should be explicitly disabled
    'advanced.default-zoom-level': number, // the default zoom level for sites that have no specific setting
    'advanced.pdfjs-enabled': boolean, // Whether or not to render PDF documents in the browser
    'advanced.smooth-scroll-enabled': boolean, // false if smooth scrolling should be explicitly disabled
    'shutdown.clear-history': boolean, // true to clear history on shutdown
    'shutdown.clear-downloads': boolean, // true to clear downloads on shutdown
    'shutdown.clear-cache': boolean, // true to clear cache on shutdown
    'shutdown.clear-all-site-cookies': boolean, // true to clear all site cookies on shutdown
  }],
  dictionary: {
    locale: string, // en_US, en, or any other locale string
    ignoredWords: Array<string>, // List of words to ignore
    addedWords: Array<string> // List of words to add to the dictionary
  }
}
```

WindowStore

```javascript
{
  activeFrameKey: number,
  previewFrameKey: number,
  tabs: [{
    themeColor: string, // css compatible color string
    computedThemeColor: string, // css computed theme color from the favicon
    icon: string, // favicon url
    audioPlaybackActive: boolean, // frame is playing audio
    audioMuted: boolean, // frame is muted
    title: string, // page title
    isPrivate: boolean, // private browsing tab
    partitionNumber: number, // the session partition to use
    pinnedLocation: string, // Indicates if a frame is pinned and its pin location
    provisionalLocation: string,
    icon: string, // favicon url
    location: string, // The currently navigated location
    loading: boolean,
    frameKey: number
  }],
  frames: [{
    audioMuted: boolean, // frame is muted
    audioPlaybackActive: boolean, // frame is playing audio
    canGoBack: boolean,
    canGoForward: boolean,
    icon: string, // favicon url
    location: string, // The currently navigated location
    src: string, // The iframe src attribute
    pinnedLocation: string, // Indicates if a frame is pinned and its pin location
    title: string, // page title
    findbarShown: boolean, // whether the findbar is shown
    findbarSelected: boolean,  // findbar text input is selected
    hrefPreview: string, // show hovered link preview
    key: number,
    isPrivate: boolean, // private browsing tab
    partitionNumber: number, // the session partition to use
    loading: boolean,
    themeColor: string, // css compatible color string
    computedThemeColor: string, // css computed theme color from the favicon
    isFullScreen: boolean, // true if the frame should be shown as full screen
    showFullScreenWarning: boolean, // true if a warning should be shown about full screen
    startLoadTime: datetime,
    endtLoadTime: datetime,
    guestInstanceId: string, // not persisted
    tabId: number, // session tab id not persisted
    closedAtIndex: number, // Index the frame was last closed at, cleared unless the frame is inside of closedFrames
    activeShortcut: string, // Set by the application store when the component should react to a shortcut
    activeShortcutDetails: object, // Additional parameters for the active shortcut action if any
    lastZoomPercentage: number, // Last value that was used for zooming
    adblock: {
      blocked: Array<string>
    },
    trackingProtection: {
      blocked: Array<string>
    },
    httpsEverywhere: Object.<string, Array.<string>>, // map of XML rulesets name to redirected resources
    noScript: {
      blocked: Array<string>
    },
    fingerprintingProtection: {
      blocked: Array<string>
    },
    provisionalLocation: string,
    security: {
      isSecure: boolean, // is using https
      loginRequiredDetail: {
        isProxy: boolean,
        host: string,
        port: number,
        realm: string
      },
      isExtendedValidation: boolean, // is using https ev
      activeMixedContent: boolean, // has active mixed content
      passiveMixedContent: boolean, // has passive mixed content
    },
    parentFrameKey: number, // the key of the frame this frame was opened from
    modalPromptDetail: {...},
    basicAuthDetail: {...},
    findDetail: {
      searchString: string, // the string being searched
      caseSensitivity: boolean, // whether we are doing a case sensitive search
      numberOfMatches: number, // Total number of matches on the page
      activeMatchOrdinal: number // The current ordinal of the match
    }
    unloaded: boolean, // true if the tab is unloaded

    navbar: {
      focused: boolean, // whether the navbar is focused
      urlbar: {
        location: string, // the string displayed in the urlbar
        urlPreview: string,
        suggestions: {
          selectedIndex: number, // index of the item in focus
          searchResults: array, // autocomplete server results if enabled
          suggestionList: {
            title: string, // The title of the autocomplete entry
            location: string, // The location represented by the autocomplete entry
            onClick: function, // The onClick handler for suggestion clicks (e.g. URL load or tab switch)
            type: string // The type of suggestion (one of js/constants/suggestionTypes.js)
          },
          urlSuffix: string, // autocomplete suffix
          autocompleteEnabled: boolean // used to enable or disable autocomplete
        },
        focused: boolean, // whether the urlbar is focused
        active: boolean, // whether the user is typing in the urlbar
        selected: boolean // is the urlbar text selected
      }
    },
    aboutDetails: object, // details for about pages
    history: array // navigation history
  }],
  closedFrames: [], // holds the same type of frame objects as above
  ui: {
    isMaximized: boolean, // true if window is maximized
    position: array, // last known window position
    isFullScreen: boolean, // true if window is fullscreen
    mouseInTitlebar: boolean, //Whether or not the mouse is in the titlebar
    dragging: {
      dragType: string, // tab, bookmark
      draggingOver: {
        draggingOverLeft: boolean,
        draggingOverRight: boolean,
        dragKey: any,
        dragType: string
      }
    },
    tabs: {
      tabPageIndex: number, // Index of the current tab page
      previewTabPageIndex: number // Index of the tab being previewed
    },
    siteInfo: {
      isVisible: boolean // Whether or not to show site info like # of blocked ads
    },
    noScriptInfo: {
      isVisible: boolean, // Whether the noscript infobox is visible
    },
    downloadsToolbar: {
      isVisible: boolean, // Whether or not the downloads toolbar is visible
    },
    releaseNotes: {
      isVisible: boolean, // Whether or not to show release notes
    }
  },
  searchDetail: {
    searchURL: string, // with replacement var in string: {searchTerms}
    autocompleteURL: string, // ditto re: {searchTerms}
  },
  bookmarkDetail: {
    currentDetail: Object, // Detail of the current bookmark which is in add/edit mode
    originalDetails: Object // Detail of the original bookmark to edit
  },
  braveryPanelDetail: {
    advancedControls: boolean, // If specified, indicates if advanced controls should be shown
    expandAdblock: boolean, // If specified, indicates if the tracking protection and adblock section should be expanded
    expandHttpse: boolean, // If specified, indicates if the httpse section should be expanded
    expandNoScript: boolean, // Whether noscript section should be expanded
    expandFp: boolean // Whether fingerprinting protection should be expanded
  },
  clearBrowsingDataDetail: {
    browserHistory: boolean,
    downloadHistory: boolean,
    cachedImagesAndFiles: boolean,
    savedPasswords: boolean,
    allSiteCookies: boolean
  },
  contextMenuDetail: {
    left: number, // the left position of the context menu
    right: number, // the right position of the context menu
    top: number, // the top position of the context menu
    bottom: number, // the bottom position of the context menu
    maxHeight: number, // the maximum height of the context menu
    template: [{
      label: string, // label of context menu item
      click: function, // callback for the context menu to call when clicked
      dragOver: function, // callback for when something is dragged over this item
      drop: function, // callback for when something is dropped on this item
    }],
    openedSubmenuDetails: [{
      y: number, // the relative y position
      template: [
        // per above
      ]
    }]
  },
  popupWindowDetail: {
    left: number, // the left position of the popup window
    right: number, // the right position of the popup window
    top: number, // the top position of the popup window
    bottom: number, // the bottom position of the popup window
    maxHeight: number, // the maximum height of the popup window
    src: string, // the src for the popup window webview
  },
  flashInitialized: boolean, // Whether flash was initialized successfully. Cleared on shutdown.
  cleanedOnShutdown: boolean, // whether app data was successfully cleared on shutdown
  lastAppVersion: string, // Version of the last file that was saved
  ledgerInfo: {
    creating: boolean,
    created: boolean,
    reconcileStamp: number,
    reconcileDelay: ?,
    delayStamp: ?,
    transactions: Array,
    balance: string, // balance in BTC
    unconfirmed: string, // unconfirmed balance in BTC
    satoshis: number, // balance as a number of satoshis
    address: string,
    btc: string, // BTC to pay per month
    amount: number, // currency amount to pay per month
    currency: string, // currency string
    paymentURL: string,
    paymentIMG: string,
    buyURL: string,
    bravery: {
      fee: {
        currency: string,
        amount: number
      }
    }
  },
  publisherInfo: {
    synopsis: {
      hoursSpent: number,
      minutesSpent: number,
      secondsSpent: number,
      daysSpent: number,
      percentage: number,
      publisherURL: string,
      rank: number,
      views: number,
      duration: number,
      faviconURL: string,
      verified: boolean,
      site: string,
      score: ?
    }
  },
  hasBitcoinHandler: boolean // Whether Brave has a bitcoin: protocol handler
}
```
