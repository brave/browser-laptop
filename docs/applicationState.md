# Overview

All application state is managed by a top level [ImmutableJS](http://facebook.github.io/immutable-js/) object.
Child components should not modify top level state directly, instead they should call into an action which will dispatch a message to the store to make any such changes.

# Hierarchy

```javascript
{
  activeFrameKey: number,
  frames: [{
    audioMuted: boolean, // frame is muted
    audioPlaybackActive: boolean, // frame is playing audio
    canGoBack: boolean,
    canGoForward: boolean,
    icon: string, // url to favicon
    location: string, // page url
    src: string, // what the iframe src should be
    title: string, // page title
    thumbnail: string, // url to thumbnail
    key: number,
    isPrivate: boolean, // private browsing tab
    loading: boolean,
    themeColor: string, // css compatible color string
    closedAtIndex: number, // Index the frame was last closed at, cleared unless the frame is inside of closedFrames
    activeShortcut: string, // Set by the application store when the component should react to a shortcut
    security: {
      isSecure: boolean, // is using https
      isExtendedValidation: boolean, // is using https ev
    },
    contextMenuDetail: {...},
    modalPromptDetail: {...},
    basicAuthDetail: {...}
    unloaded: boolean, // true if the tab is unloaded
  }],
  sites: [{
    location: string,
    title: string,
    tags: [string], // empty, 'bookmark', 'pinned', or 'reader'
    lastAccessed: datetime,
  }],
  visits: [{
    location: string,
    startTime: datetime
    endTime: datetime
  }],
  closedFrames: [], // holds the same type of frame objects as above
  ui: {
    tabs: {
      activeDraggedTab: object,
      tabPageIndex: number, // Index of the current tab page
    },
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
        autoselected: boolean, // is the urlbar text autoselected
      }
    }
  },
  searchDetail: {
    searchURL: string, // with replacement var in string: {searchTerms}
    autocompleteURL: string, // ditto re: {searchTerms}
  }
}
```
