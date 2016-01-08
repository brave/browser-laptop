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
    tags: [string], // empty, 'bookmark', 'pinned', or 'reader'
    lastAccessed: datetime,
  }],
  visits: [{
    location: string,
    startTime: number, // datetime.getTime()
    endTime: number // datetime.getTime()
  }],
  adblock: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: number, // last checked data file version
    lastCheckDate: number // last checked data file date.getTime()
  },
  trackingProtection: {
    etag: string, // last downloaded data file etag
    lastCheckVersion: number, // last checked data file version
    lastCheckDate: number // last checked data file date.getTime()
  },
  defaultWindowHeight: number,
  defaultWindowWidth: number,
  updateAvailable: false,
}
```

WindowStore

```javascript
{
  activeFrameKey: number,
  frames: [{
    audioMuted: boolean, // frame is muted
    audioPlaybackActive: boolean, // frame is playing audio
    canGoBack: boolean,
    canGoForward: boolean,
    isPinned: boolean, // true when the tab is pinned
    icon: string, // url to favicon
    location: string, // page url
    src: string, // what the iframe src should be
    title: string, // page title
    findbarShown: boolean, // whether the findbar is shown
    thumbnail: string, // url to thumbnail
    key: number,
    isPrivate: boolean, // private browsing tab
    loading: boolean,
    themeColor: string, // css compatible color string
    computedThemeColor: string, // css computed theme color from the favicon
    startLoadTime: datetime,
    endtLoadTime: datetime,
    closedAtIndex: number, // Index the frame was last closed at, cleared unless the frame is inside of closedFrames
    activeShortcut: string, // Set by the application store when the component should react to a shortcut
    security: {
      isSecure: boolean, // is using https
      isExtendedValidation: boolean, // is using https ev
    },
    parentWindowKey: number, // the key of the window this frame was opened from
    parentFrameKey: number, // the key of the frame this frame was opened from
    contextMenuDetail: {...},
    modalPromptDetail: {...},
    basicAuthDetail: {...},
    findDetail: {
      searchString: string, // the string being searched
      caseSensitivity: boolean // whether we are doing a case sensitive search
    }
    unloaded: boolean, // true if the tab is unloaded
    navbar: {
      focused: boolean, // whether the navbar is focused
      urlbar: {
        location: string, // the string displayed in the urlbar
        urlPreview: string,
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
    tabs: {
      activeDraggedTab: object,
      tabPageIndex: number, // Index of the current tab page
    }
  },
  searchDetail: {
    searchURL: string, // with replacement var in string: {searchTerms}
    autocompleteURL: string, // ditto re: {searchTerms}
  }
}
```
