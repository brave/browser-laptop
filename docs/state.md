# Overview

All application state is managed by a top level [ImmutableJS](http://facebook.github.io/immutable-js/) object.
Child components should not modify top level state directly, instead they should call into an action which will dispatch a message to the store to make any such changes.

# Hierarchy

AppStore

```javascript
{
  // resourceIdentifier is one of: `adblock`, `safeBrowsing`, `trackingProtection`,
  // `httpsEverywhere`, or another additional resource by name such as
  // adblock regional resource files.
  [resourceIdentifier]: {
    count: number, // number of blocked ads application wide
    enabled: boolean, // enable the resource
    etag: string, // last downloaded data file etag
    lastCheckDate: number, // last checked data file date.getTime()
    lastCheckVersion: string, // last checked data file version
  },
  about: {
    brave: {
      versionInformation: {
        [name]: string
      } // map of property name to version. used on about:brave. not persisted (removed on save)
    },
    history: {
      entries: [object] // used on about:history. not persisted (removed on save)
    },
    newtab: {
      gridLayoutSize: string, // 'small', 'medium', 'large'
      ignoredTopSites: [string], // list of ignored sites
      pinnedTopSites: [string], // list of pinned sites to be used on gridLayout. Defaults to 1 Brave-related site; see data/newTabData.js => pinnedTopSites
      sites: [string], // list of sites to be used on gridLayout. Defaults to 6 Brave-related sites; see data/newTabData.js => topSites
      updatedStamp: number, // timestamp for when the data was last updated
    },
    preferences: {
      backupNotifyCount: number, // number of times user has been reminded to backup wallet
      backupNotifyTimestamp: number, // number of milliseconds from the last reminder until the next
      backupSucceeded: (boolean|undefined), // was last backup successful?
      recoveryBalanceRecalculated: (boolean|undefined),
      recoverySucceeded: (boolean|undefined),
      updatedStamp: number
    }
  },
  adInsertion: {
    enabled: boolean // enable ad insertion
  },
  autofill: {
    addresses: {
      guid: Array<string>, // list of id used to access the autofill entry in database
      timestamp: number
    },
    creditCards: {
      guid: Array<string>, // list of id used to access the autofill entry in database
      timestamp: number
    }
  },
  bookmarks: {
    [bookmarkKey]: {
      favicon: string, // URL of the favicon
      key: string, // key is duplication of bookmarkKey
      location: string,
      objectId: Array.<number>,
      originalSeed: Array.<number>, // bookmarks that have been synced before a sync profile reset
      parentFolderId: number,
      partitionNumber: number, // optionally specifies a specific session
      skipSync: boolean,
      title: string
    }
  },
  bookmarkFolders: {
    [folderKey]: {
      folderId: number,
      key: string, // key is duplication of folderKey
      objectId: Array.<number>,
      originalSeed: Array.<number>, // only set for bookmarks that have been synced before a sync profile reset
      parentFolderId: number, // set for bookmarks and bookmark folders only
      skipSync: boolean, // Set for objects FETCHed by sync
      title: string
    }
  },
  cache: {
    bookmarLocation: {
      [location]: Array<string> // array of bookmark keys
    },
    bookmarkOrder: {
      [parentId]: [{
        key: string, // bookmark or folder key
        order: number,
        type: string // siteTags.BOOKMARK or siteTags.BOOKMARK_FOLDER
      }]
    },
    ledgerVideos: {
      [mediaKey]: {
        publisher: string // publisher key
        // Twitch
        event: string, // event that was send to Twitch
        time: number, // timestamp that we will log in the ledger
        status: string // playing status: playing or paused
      }
    }
  }
  clearBrowsingDataDefaults: {
    allSiteCookies: boolean,
    autocompleteData: boolean,
    autofillData: boolean,
    browserHistory: boolean,
    cachedImagesAndFiles: boolean,
    downloadHistory: boolean,
    paymentHistory: boolean,
    publishersClear: boolean,
    savedPasswords: boolean,
    savedSiteSettings: boolean
  },
  cookieblock: {
    enabled: boolean // enable 3p cookie/referer blocking
  },
  cookieblockAll: {
    enabled: boolean // enable all cookie/referer blocking
  },
  defaultBrowserCheckComplete: boolean, // true to indicate default browser check is complete
  defaultWindowHeight: number, // DEPRECATED (0.12.7); replaced w/ defaultWindowParams.height
  defaultWindowParams: {
    height: number,
    width: number,
    x: number,
    y: number
  },
  defaultWindowWidth: number, // DEPRECATED (0.12.7); replaced w/ defaultWindowParams.width
  downloads: [{
    [downloadId]: {
      filename: string,
      receivedBytes: Number,
      savePath: string,
      startTime: number, // datetime.getTime()
      state: string, // one of: 'pending', 'in-progress', 'completed', 'cancelled', 'interrupted'
      totalBytes: Number,
      url: string
    }
  }],
  extensions: {
    [id]: {
      excluded: boolean, // true if extension was excluded by the user
      base_path: string,
      browserAction: {
        icon: (string|object),
        popup: string,
        title: string
      },
      contextMenus: {
        extensionId: string,
        menuItemId: string,
        properties: object
      },
      description: string,
      enabled: boolean,
      id: string,
      manifest: object,
      tabs: {
        [tabId]: {
          browserAction: object // tab specific browser action properties
        }
      }
    } // the unique id of the extension
  },
  fingerprintingProtection: {
    enabled: boolean // enable 3p fingerprinting blocking. default true.
  },
  fingerprintingProtectionAll: {
    enabled: boolean // enable all fingerprinting blocking. default false.
  },
  firstRunTimestamp: integer,
  flash: {
    enabled: boolean // enable flash
  },
  historySites: {
    [siteKey]: {
      favicon: string, // URL of the favicon
      lastAccessedTime: number, // datetime.getTime()
      location: string,
      objectId: Array.<number>,
      partitionNumber: number, // optionally specifies a specific session
      skipSync: boolean, // Set for objects FETCHed by sync
      title: string,
      themeColor: string
    }
  },
  ledger: {
    about: {
      synopsis: Array.Object,
      synopsisOptions: Object
    },
    info: {
      addresses: {
        BAT: string,
        BTC: string,
        CARD_ID: string,
        ETH: string,
        LTC: string
      },
      balance: number, // confirmed balance in BAT.toFixed(2)
      bravery: {
        days: number,
        fee: {
          amount: number,
          currency: string
        },
        setting: string
      },
      contributionAmount: number,
      converted: string,
      created, boolean, // wallet is created
      creating: boolean, // wallet is being created
      currentRate: number,
      grants: [{
        amount: number,
        expirationDate: number
      }]
      hasBitcoinHandler: boolean, // brave browser has a `bitcoin:` URI handler
      monthlyAmounts: Array<float> // list of all monthly amounts for the contribution
      passphrase: string, // the BAT wallet passphrase
      paymentId: string,
      probi: number,
      rates:{
        BTC: string,
        ETH: number,
        EUR: number,
        USD: number
      },
      reconcileFrequency: number, // duration between each reconciliation in days
      reconcileStamp: number,  // timestamp for the next reconcilation
      transactions: [{
        ballots: {
          [publisher]: number // e.g., "wikipedia.org": 3
        }, // number of ballots cast for each publisher
        contribution: {
          fee: number, // bitcoin transaction fee
          fiat: {
            amount: number, // e.g., 5
            currency: string // e.g., "USD"
          }, // roughly-equivalent fiat amount
          rates: {
            [currency]: number //e.g., { "USD": 575.45 }
          },  // exchange rate
          probi: number, // actual number of probi transferred
        },
        count: number, // total number of ballots allowed to be cast
        submissionStamp: number, // timestamp for this contribution
        viewingId: string, // UUIDv4 for this contribution
      }],
      unconfirmed: string, // unconfirmed balance in BAT.toFixed(2)
      userFunded: number, // amount funded by the user
      userHasFunded: boolean // permanently true once user funds wallet
    },
    locations: {
      [url]: {
        publisher: string // url of the publisher in question
      }
    },
    promotion: {
      activeState: string,
      claimedTimestamp: number,
      minimumReconcileTimestamp: number,
      promotionId: number,
      promotionStatus: string,
      remindTimestamp: number,
      stateWallet: {
        disabledWallet: {
          notification: {
            buttons: [{
              buttonActionId: string,
              className: string,
              text: string
            }],
            firstShowTimestamp: number,
            greeting: string,
            message: string,
            messageAction: string,
            options: {
              persist: boolean,
              style: string
            }
          },
          panel: {
            optInMarkup: {
              message: Array<string>,
              title: string
            }
          }
        },
        emptyWallet: {
          notification: {
            buttons: [{
              buttonActionId: string,
              className: string,
              text: string
            }],
            firstShowTimestamp: number,
            greeting: string,
            message: string,
            messageAction: string,
            options: {
              persist: boolean,
              style: string
            }
          },
          panel: {
            disclaimer: string,
            optedInButton: string,
            successText: {
              message: string,
              title: string
            }
          }
        },
        fundedWallet: {
          notification: {
            buttons: [{
              buttonActionId: string,
              className: string,
              text: string
            }],
            firstShowTimestamp: number,
            greeting: string,
            message: string,
            messageAction: string,
            options: {
              persist: boolean,
              style: string
            }
          },
          panel: {
            disclaimer: string,
            optedInButton: string,
            successText: {
              message: string,
              title: string
            }
          }
        }
      }
    }
    publisherTimestamp: number, // timestamp of last publisher update in the database
    status: string, // ledger status
    synopsis: {
      options: {
        emptyScores: {
          concave: number,
          visits: number
        },
        frameSize: number,
        minPublisherDuration: number,
        minPublisherVisits: number,
        numFrames: number,
        scorekeeper: string, // concave or visits
        scorekeepers: Array<string>, // concave and visits
        showOnlyVerified: boolean
      },
      publishers: {
        [publisherId]: {
          duration: number,
          faviconName: string,
          faviconURL: string,
          options: {
            exclude: boolean, // publisher should not be included, toggle is off
            verified: boolean,
            verifiedTimestamp: number, // timestamp of the last change
            stickyP: boolean
          },
          pinPercentage: number,
          protocol: string,
          publisherURL: string,
          providerName: string,
          scores: {
            concave: number,
            visits: number
          },
          visits: number,
          weight: number,
          window: [{
            timestamp: number,
            visits: number,
            duration: number,
            scores: {
              concave: number,
              visits: number
            }
          }]
        }
      }
    }
  },
  menu: {
    template: object // used on Windows and by our tests: template object with Menubar control
  },
  notifications: [{
    buttons: [{
      className: string, // button class e.g. 'primary'. see notificationBar.less
      text: string // button text
    }],
    frameOrigin: (string|undefined), // origin that the notification is from, or undefined if not applicable.
    message: string,
    options: {
      advancedLink: string, // more info link URL
      advancedText: string, // more info text
      persist: boolean, // whether to show a 'Remember this decision' checkbox
      style: string // css class for notification bar. See notificationBar.less
    }
  }], // the notifications for the frame. not preserved across restart.
  noScript: {
    enabled: boolean // enable noscript
  },
  pageData: {
    info: {
      [urlKey]: {
        faviconURL: string,
        protocol: string,
        publisher: string,
        timestamp: number,
        url: string
      }
    },
    last: {
      info: string, // last added info
      tabId: number, // last active tabId,
      closedTabValue: object // last closed tab data
    }
  },
  pinnedSites: {
    [siteKey]: {
      location: string,
      title: string,
      order: number
    }
  },
  settings: {
    // See defaults in js/constants/appConfig.js
    'adblock.customRules': string, // custom rules in ABP filter syntax
    'advanced.default-zoom-level': number, // the default zoom level for sites that have no specific setting
    'advanced.hardware-acceleration-enabled': boolean, // false if hardware acceleration should be explicitly disabled
    'advanced.pdfjs-enabled': boolean, // whether or not to render PDF documents in the browser
    'advanced.send-crash-reports': boolean, // true or undefined if crash reports should be sent
    'advanced.send-usage-statistics': boolean, // true or undefined if usage reports should be sent
    'advanced.smooth-scroll-enabled': boolean, // false if smooth scrolling should be explicitly disabled
    'advanced.torrent-viewer-enabled': boolean, // whether to render magnet links in the browser
    'bookmarks.toolbar.show': boolean, // true if the bookmakrs toolbar should be shown
    'extensions.pocket.enabled': boolean, // true if pocket is enabled
    'extensions.vimium.enabled': boolean, // true if vimium is enabled
    'extensions.honey.enabled': boolean, // true if Honey is enabled
    'general.autohide-menu': boolean, // true if the Windows menu should be autohidden
    'general.wide-url-bar': boolean, // true to use wide URL bar
    'general.bookmarks-toolbar-mode': boolean, // true to show bookmarks toolbar
    'general.check-default-on-startup': boolean, // true to check whether brave is default browser on startup
    'general.disable-title-mode': boolean, // true if title mode should always be disabled
    'general.downloads.default-save-path': string, // default path for saving files
    'general.homepage': string, // URL of the user's homepage
    'general.is-default-browser': boolean, // true if brave is default browser
    'general.language': string, // the language code to use for localization and spell check or null to use the system default
    'general.newtab-mode': string,  // one of: newTabPage, homePage, defaultSearchEngine
    'general.show-home-button': boolean, // true if the home button should be shown
    'general.startup-mode': string, // one of: lastTime, homePage, newTabPage
    'notification-add-funds-timestamp': number, // timestamp on which we decide if we will show notification Add founds
    'notification-reconcile-soon-timestamp': number, // timestamp
    'payments.allow-media-publishers': boolean,
    'payments.allow-non-verified-publishers': boolean,
    'payments.contribution-amount': number, // in USD
    'payments.enabled': boolean, // true if the Payments pane is active
    'payments.minimum-visit-time': number,
    'payments.minimum-visits': number,
    'payments.notification-add-funds-timestamp': number,
    'payments.notification-reconcile-soon-timestamp': number,
    'payments.notification-try-payments-dismissed': boolean, // true if you dismiss the message or enable Payments
    'payments.notifications': boolean, // true to show payment notifications
    'payments.sites-auto-suggest': boolean, // show auto suggestion
    'payments.sites-hide-excluded': boolean, // whether to hide excluded sites in the payments list
    'payments.sites-show-less': boolean, // whether to show less sites in the payments list
    'privacy.autocomplete.history-size': number, // number of autocomplete entries to keep
    'privacy.autofill-enabled': boolean, // true to enable autofill
    'privacy.bookmark-suggestions': boolean, // auto suggest for bookmarks enabled
    'privacy.do-not-track': boolean, // whether DNT is 1
    'privacy.history-suggestions': boolean, // auto suggest for history enabled
    'privacy.opened-tab-suggestions': boolean, // auto suggest for opened tabs enabled
    'privacy.topsite-suggestions': boolean, // auto suggest for top site enabled
    'search.default-search-engine': string, // name of search engine, from js/data/searchProviders.js
    'search.offer-search-suggestions': boolean, // true if suggestions should be offered from the default search engine when available.
    'security.flash.installed': boolean,
    'security.site-isolation-enabled': boolean,
    'shields.blocked-count-badge': boolean, // true if blocked counts on the shield button should be enabled
    'shields.compact-bravery-panel': boolean, // true if the compact Bravery panel should be enabled
    'security.passwords.active-password-manager': string, // name of active password manager
    'security.fullscreen.content': string, // whether or not user choose to allow fullscreen content by default
    'shutdown.clear-all-site-cookies': boolean, // true to clear all site cookies on shutdown
    'shutdown.clear-autocomplete-data': boolean, // true to clear all autocomplete data on shutdown
    'shutdown.clear-autofill-data': boolean, // true to clear all autofill data on shutdown
    'shutdown.clear-cache': boolean, // true to clear cache on shutdown
    'shutdown.clear-downloads': boolean, // true to clear downloads on shutdown
    'shutdown.clear-history': boolean, // true to clear history on shutdown
    'shutdown.clear-site-settings': boolean, // true to clear site settings on shutdown
    'tabs.close-action': string, // one of: parent, lastActive, next
    'tabs.paint-tabs': boolean, // true if the page theme color and favicon color should be used for tabs
    'tabs.show-tab-previews': boolean, // true to show tab previews
    'tabs.switch-to-new-tabs': boolean, // true if newly opened tabs should be focused immediately
    'tabs.tabs-per-page': number, // number of tabs per tab page

    // DEPRECATED with 0.11.4
    'security.passwords.dashlane-enabled': boolean, // true if the Dashlane extension should be enabled
    'security.passwords.last-pass-enabled': boolean, // true if the Last password extension should be enabled
    'security.passwords.manager-enabled': boolean, // whether to use default password manager
    'security.passwords.one-password-enabled': boolean, // true if the 1Password extension should be enabled

    // DEPRECATED with 0.12.6
    'bookmarks.toolbar.showFavicon': boolean, // true if bookmark favicons should be shown on the bookmarks toolbar
    'bookmarks.toolbar.showOnlyFavicon': boolean, // true if only favicons should be shown on the bookmarks toolbar

    // DEPRECATED with 0.21.0
    'advanced.hide-excluded-sites': boolean, // whether to hide excluded sites in the payments list
    'advanced.hide-lower-sites': boolean,
    'advanced.minimum-visit-time': number,
    'advanced.minimum-visits': number,
    'advanced.auto-suggest-sites': boolean // show auto suggestion
  },
  siteSettings: {
    [hostPattern]: {
      adControl: string, // (showBraveAds | blockAds | allowAdsAndTracking)
      autoplay: boolean,
      cookieControl: string, // (block3rdPartyCookie | allowAllCookies | blockAllCookies)
      fingerprintingProtection: string, // (block3rdPartyFingerprinting | allowAllFingerprinting | blockAllFingerprinting)
      flash: (number|boolean), // approval expiration time if allowed, false if never allow
      fullscreenPermission: boolean,
      geolocationPermission: boolean,
      httpsEverywhere: boolean,
      ledgerPayments: boolean, // false if site should not be paid by the ledger. Defaults to true.
      ledgerPaymentsShown: boolean, // false if site has been deleted, should not be paid by the ledger and should not be shown in the UI. Defaults to true.
      mediaPermission: boolean,
      midiSysexPermission: boolean,
      notificationsPermission: boolean,
      noScript: (number|boolean), // true = block scripts, false = allow, 0 = allow once, 1 = allow until restart
      noScriptExceptions: {[hostPattern]: (number|boolean)}, // hosts where scripts are allowed once (0) or until restart (1). false = block
      objectId: Array.<number>,
      openExternalPermission: boolean,
      pointerLockPermission: boolean,
      protocolRegistrationPermission: boolean,
      runInsecureContent: boolean, // allow active mixed content
      safeBrowsing: boolean,
      siteName: string, // display name of the publisher
      skipSync: boolean, // Set for objects FETCHed by sync
      savePasswords: boolean, // only false or undefined/null
      shieldsUp: boolean,
      widevine: (number|boolean), // false = block widevine, 0 = allow once, 1 = allow always
      zoomLevel: number
    }
  },
  defaultSiteSettingsListImported: boolean,
  sync: {
    lastFetchTimestamp: integer // the last time new sync records were fetched in seconds
    deviceId: Array.<number>,
    devices: {
      [deviceId]: {
        name: string,
        lastRecordTimestamp: number // last seen Sync record from this device
      }
    },
    objectId: Array.<number>, // objectId for this sync device
    objectsById: {
      [string of objectId joined by pipes |]: Array.<string> // array key path within appState, so we can do appState.getIn({key path})
    },
    pendingRecords: { // OrderedMap of unconfirmed (not yet downloaded) sync records.
      [objectId]: {
        enqueueTimestamp: number // new Date().getTime() when record was submitted
        record: object, // Sync record sent with SEND_SYNC_RECORDS
      }
    },
    seed: Array.<number>,
    seedQr: string, // data URL of QR code representing the seed
    setupError: string? // indicates that an error occurred during sync setup
  },
  tabs: [{
    // persistent properties
    active: boolean,  // whether the tab is selected
    favIconUrl: string,
    id: number,
    index: number,  // the position of the tab in the window
    title: string,
    url: string,
    windowUUID: string,  // the permanent identifier for the window
    // session properties
    audible: boolean, // is audio playing (muted or not)
    canGoBack: boolean, // the tab can be navigated back
    canGoForward: boolean, // the tab can be navigated forward
    messageBoxDetail: { // fields used if showing a message box for a tab
      buttons: [string], // array of buttons as string; code only handles 1 or 2
      cancelId: number // optional: used for a confirm message box
      message: string,
      showSuppress: boolean, // final result of the suppress checkbox
      suppress: boolean, // if true, show a suppress checkbox (defaulted to not checked)
      title: string, // title is the source; ex: "brave.com says:"
    },
    muted: boolean, // is the tab muted,
    zoomPercent: number, // current zoom levellast
    windowId: number // the windowId that contains the tab
    guestInstanceId: number,
    tabId: number
  }],
  temporarySiteSettings: {
    // Same as siteSettings but never gets written to disk
    // XXX: This was intended for Private Browsing but is currently unused.
  },
  tor: {
    percentInitialized: number, // percentage initialized
    initializationError: string|boolean, // error message. false means successfully initialized.
  },
  updates: {
    lastCheckTimestamp: boolean,
    metadata: {
      name: string, // name of the update
      notes: string // release notes for the active update
    },
    referralDownloadId: string, // download ID that is returned from the referral server
    referralHeaders: [{
      domains: Array<string>,
      headers: [{
        domains: Array<string>,
        headers: { [headerName]: string },
        cookieNames: Array<string>,
        expiration: number
      }],
      cookieNames: Array<string>,
      expiration: number
    }],
    referralTimestamp: number, // timestamp when referral was accumulated (after ~30 days)
    referralPage: string, // page that we open when browser starts
    referralPromoCode: string, // promo code for the referral
    status: string, // updateStatus from js/constants/updateStatus.js
    verbose: boolean // whether to show update UI for checking, downloading, and errors
  },
  visits: [{
    endTime: number, // datetime.getTime()
    location: string,
    startTime: number // datetime.getTime()
  }],
  widevine: {
    enabled: boolean, // true if widevine is installed and enabled
    ready: boolean // true if widevine is in a ready state
  },
  windows: [{
    // persistent properties
    focused: boolean,
    height: number,
    left: number,
    state: string  // "normal", "minimized", "maximized", or "fullscreen"
    top: number,
    type: string,  // "normal", "popup", or "devtools"
    width: number,
    // session properties
    windowId: number  // the muon id for the window
  }],
  searchDetail: {
    autocompleteURL: string, // ditto re: {searchTerms}
    searchURL: string // with replacement var in string: {searchTerms}
  },
  windowReady: boolean // set to false on start; set to true when first window is ready
}
```

WindowStore

```javascript
{
  activeFrameKey: number,
  autofillAddressDetail: {
    city: string,
    country: string,
    email: string,
    guid: string, // id used to access the autofill entry in database
    name: string,
    organization: string,
    phone: string,
    postalCode: string,
    state: string,
    streetAddress: string
  },
  autofillCreditCardDetail: {
    card: string,
    guid: string, // id used to access the autofill entry in database
    month: string,
    name: string,
    year: string
  },
  bookmarkDetail: {
    currentDetail: object, // detail of the current bookmark which is in add/edit mode
    originalDetails: object, // detail of the original bookmark to edit
    shouldShowLocation: boolean // whether or not to show the URL input
  },
  braveryPanelDetail: {
    advancedControls: boolean, // if specified, indicates if advanced controls should be shown
    expandAdblock: boolean, // if specified, indicates if the tracking protection and adblock section should be expanded
    expandFp: boolean, // whether fingerprinting protection should be expanded
    expandHttpse: boolean, // if specified, indicates if the httpse section should be expanded
    expandNoScript: boolean // whether noscript section should be expanded
  },
  cleanedOnShutdown: boolean, // whether app data was successfully cleared on shutdown
  closedFrames: [], // holds the same type of frame objects as frames
  contextMenuDetail: { // currently using uuid hack to avoid serializing click function in template
    bottom: number, // the bottom position of the context menu
    left: number, // the left position of the context menu
    maxHeight: number, // the maximum height of the context menu
    openedSubmenuDetails: [{
      template: [], // same as template in contextMenuDetail
      y: number // the relative y position
    }],
    right: number, // the right position of the context menu
    template: [{
      click: function, // callback for the context menu to call when clicked
      dragOver: function, // callback for when something is dragged over this item
      drop: function, // callback for when something is dropped on this item
      label: string // label of context menu item
    }],
    top: number // the top position of the context menu
  },
  createdFaviconDirectory: boolean, // whether the ledger-favicons directory has been created already in the appData directory
  frames: [{
    aboutDetails: object, // details for about pages
    adblock: {
      blocked: Array<string>
    },
    audioMuted: boolean, // frame is muted
    audioPlaybackActive: boolean, // frame is playing audio
    basicAuthDetail: object,
    closedAtIndex: number, // index the frame was last closed at, cleared unless the frame is inside of closedFrames
    computedThemeColor: string, // CSS computed theme color from the favicon
    endtLoadTime: datetime,
    findbarShown: boolean, // whether the findbar is shown
    findbarSelected: boolean,  // findbar text input is selected
    fingerprintingProtection: {
      blocked: Array<string>
    },
    findDetail: {
      searchString: string, // the string being searched
      caseSensitivity: boolean, // whether we are doing a case sensitive search
      numberOfMatches: number, // total number of matches on the page
      activeMatchOrdinal: number, // the current ordinal of the match
      internalFindStatePresent: boolean // true if a find-first (ie findNext: false) call has been made
    }
    guestInstanceId: string, // not persisted
    hasBeenActivated: boolean, // whether this frame has ever been the active frame
    history: array, // navigation history
    hrefPreview: string, // show hovered link preview
    httpsEverywhere: Object<string, Array<string>>, // map of XML rulesets name to redirected resources
    icon: string, // favicon url
    isFullScreen: boolean, // true if the frame should be shown as full screen
    isPrivate: boolean, // private browsing tab
    key: number,
    lastAccessedTime: datetime,
    loading: boolean,
    location: string, // the currently navigated location
    modalPromptDetail: object,
    navbar: {
      urlbar: {
        active: boolean, // whether the user is typing in the urlbar
        focused: boolean, // whether the urlbar should be focused instead of the webview
        location: string, // the string displayed in the urlbar
        searchDetail: object,
        selected: boolean, // is the urlbar text selected
        suggestions: {
          autocompleteEnabled: boolean, // used to enable or disable autocomplete
          selectedIndex: number, // index of the item in focus
          shouldRender: boolean, // if the suggestions should render
          suggestionList: {
            location: string, // the location represented by the autocomplete entry
            onClick: function, // the onClick handler for suggestion clicks (e.g. URL load or tab switch)
            title: string, // the title of the autocomplete entry
            type: string // the type of suggestion (one of js/constants/suggestionTypes.js)
          },
          urlSuffix: string // autocomplete suffix
        }
      }
    },
    noScript: {
      blocked: Array<string>
    },
    openerTabId: number, // web contents tabId that opened this tab
    partitionNumber: number, // the session partition to use
    parentFrameKey: number, // the key of the frame this frame was opened from
    pinnedLocation: string, // indicates if a frame is pinned and its pin location
    provisionalLocation: string,
    showFullScreenWarning: boolean, // true if a warning should be shown about full screen
    security: {
      blockedRunInsecureContent: Array<string>, // sources of blocked active mixed content
      isSecure: (boolean|number), // true = fully secure, false = fully insecure, 1 = partially secure, 2 = cert error
      evCert: string,
      loginRequiredDetail: {
        isProxy: boolean,
        host: string,
        port: number,
        realm: string
      },
      runInsecureContent: boolean // has active mixed content
    },
    src: string, // the iframe src attribute
    startLoadTime: datetime,
    tabId: number, // session tab id not persisted
    themeColor: string, // CSS compatible color string
    title: string, // page title
    trackingProtection: {
      blocked: Array<string>
    },
    unloaded: boolean, // true if the tab is unloaded
  }],
  importBrowserDataDetail: [{
    cookies: boolean,
    favorites: boolean,
    history: boolean,
    index: string,
    name: string,
    type: number
  }],
  importBrowserDataSelected: {
    cookies: boolean,
    favorites: boolean,
    history: boolean,
    index: string,
    type: number
  },
  lastAppVersion: string, // version of the last file that was saved
  modalDialogDetail: {
    [className]: {
      object // props
    }
    ...
  },
  popupWindowDetail: {
    bottom: number, // the bottom position of the popup window
    left: number, // the left position of the popup window
    maxHeight: number, // the maximum height of the popup window
    right: number, // the right position of the popup window
    src: string, // the src for the popup window webview
    top: number // the top position of the popup window
  },
  previewFrameKey: number,
  quarantineNeeded: boolean, // true if quarantine needed after auto-launching
  searchResults: array, // autocomplete server results if enabled
  ui: {
    bookmarksToolbar: {
      selectedFolderId: number // folderId from the siteDetail of the currently expanded folder
    },
    downloadsToolbar: {
      isVisible: boolean // whether or not the downloads toolbar is visible
    },
    isClearBrowsingDataPanelVisible: boolean, // true if the Clear Browsing Data panel is visible
    menubar: {
      isVisible: boolean, // true if Menubar control is visible
      lastFocusedSelector: string, // selector for the last selected element (browser ui, not frame content)
      selectedIndex: Array<number> // indices of the selected menu item(s) (or null for none selected)
    }, // windows only
    mouseInTitlebar: boolean, // whether or not the mouse is in the titlebar
    noScriptInfo: {
      isVisible: boolean // Whether the noscript infobox is visible
    },
    releaseNotes: {
      isVisible: boolean // whether or not to show release notes
    },
    siteInfo: {
      isVisible: boolean // whether or not to show site info like # of blocked ads
    },
    tabs: {
      hoverTabIndex: number, // index of the current hovered tab
      intersectionRatio: number, // at which tab size position the tab sentinel is being intersected
      previewMode: boolean, // whether or not tab preview should be fired based on mouse idle time
      previewTabPageIndex: number, // index of the tab being previewed
      tabPageIndex: number // index of the current tab page
    },
  },
  widevinePanelDetail: {
    alsoAddRememberSiteSetting: boolean, // true if an allow always rule should be added for the acitve frame as well if installed
    location: string, // location this dialog is for
    shown: boolean // true if the panel is shown
  },
  windowInfo: {
    focused: boolean,
    height: number,
    left: number,
    state: string  // "normal", "minimized", "maximized", or "fullscreen"
    top: number,
    type: string,  // "normal", "popup", or "devtools"
    width: number,
  },
  // framesInternal is the same as index in the frames list, it's just a cache by frameKey and tabId
  framesInternal: {
    index: {
      [frameKey]: [index]
    },
    tabIndex: {
      [tabId]: [index]
    }
  },
}
```
