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
    lastAccessedTime: number, // datetime.getTime()
    partitionNumber: number // Optionally specifies a specific session
  }],
  visits: [{
    location: string,
    startTime: number, // datetime.getTime()
    endTime: number // datetime.getTime()
  }],
  adblock: {
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
  settings: [{
    // See defaults in js/constants/appConfig.js
    'general.startup-mode': string, // One of: lastTime, homePage, newTabPage
    'general.homepage': string, // URL of the user's homepage
    'search.default-search-engine': string, // path to the open search XML
    'tabs.switch-to-new-tabs': boolean, // true if newly opened tabs should be focused immediately
    'tabs.paint-tabs': boolean, // true if the page theme color and favicon color should be used for tabs
    'tabs.tabs-per-tab-page': number, // Number of tabs per tab page
    'tabs.show-tab-previews': boolean, // True to show tab previews
    'privacy.history-suggestions': boolean, // Auto suggest for history enabled
    'privacy.bookmark-suggestions': boolean, // Auto suggest for bookmarks enabled
    'privacy.opened-tab-suggestions': boolean, // Auto suggest for opened tabs enabled
    'security.block-reported-sites': boolean // true to block reported web forgery sites
  }]
}
```

WindowStore

```javascript
{
  activeFrameKey: number,
  previewFrameKey: number,
  frames: [{
    zoomLevel: number, // current frame zoom level
    audioMuted: boolean, // frame is muted
    audioPlaybackActive: boolean, // frame is playing audio
    canGoBack: boolean,
    canGoForward: boolean,
    icon: string, // favicon url
    location: string, // page url
    src: string, // what the iframe src should be
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
    navigationTime: datetime, // timestamp of when the user began navigation
    startLoadTime: datetime,
    endtLoadTime: datetime,
    guestInstanceId: string, // not persisted
    closedAtIndex: number, // Index the frame was last closed at, cleared unless the frame is inside of closedFrames
    activeShortcut: string, // Set by the application store when the component should react to a shortcut
    adblock: {
      blocked: Array<string>
    },
    trackingProtection: {
      blocked: Array<string>
    },
    security: {
      isSecure: boolean, // is using https
      certDetails: {
        url: string,
        error: string,
        cert: {
            data: Uint8Array,
            issuer: string
        }
      }, // the certificate details if any
      isExtendedValidation: boolean, // is using https ev
      activeMixedContent: boolean, // has active mixed content
      passiveMixedContent: boolean, // has passive mixed content
    },
    parentFrameKey: number, // the key of the frame this frame was opened from
    contextMenuDetail: {...},
    modalPromptDetail: {...},
    basicAuthDetail: {...},
    findDetail: {
      searchString: string, // the string being searched
      caseSensitivity: boolean, // whether we are doing a case sensitive search
      numberOfMatches: number // Total number of matches on the page
    }
    unloaded: boolean, // true if the tab is unloaded

    navbar: {
      focused: boolean, // whether the navbar is focused
      urlbar: {
        location: string, // the string displayed in the urlbar
        urlPreview: string,
        searchSuggestions: boolean, // true if search suggestions are enabled
        suggestions: {
          selectedIndex: number, // index of the item in focus
          searchResults: array,
          suggestionList: object,
        },
        focused: boolean, // whether the urlbar is focused
        active: boolean, // whether the user is typing in the urlbar
        selected: boolean, // is the urlbar text selected
      }
    }
  }],
  closedFrames: [], // holds the same type of frame objects as above
  ui: {
    mouseInTitlebar: boolean, //Whether or not the mouse is in the titlebar
    dragging: {
      dragType: string, // tab, bookmark
      sourceDragData: Object, // frameProps or bookmarkDetail
      draggingOver: {
        draggingOverLeft: boolean,
        draggingOverRight: boolean,
        dragKey: any,
        dragType: string
      }
    },
    tabs: {
      tabPageIndex: number, // Index of the current tab page
    },
    siteInfo: {
      isVisible: boolean, // Whether or not to show site info like # of blocked ads
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
    currentDetail: object, // Detail of the current bookmark which is in add/edit mode
    originalDetails: object // Detail of the original bookmark to edit
  },
}
```
