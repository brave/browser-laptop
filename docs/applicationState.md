# Overview

All application state is managed by a top level [ImmutableJS](http://facebook.github.io/immutable-js/) object.
Child components should not modify top level state directly, instead they should call into an action which will dispatch a message to the store to make any such changes.

# Hierarchy

```javascript
{
  activeFrameKey: number,
  frames: [{
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
    tags: [string], // empty, 'bookmark', or 'reader'
    visitCount: number,
  }],
  visits: [{
    location: string,
    startTime: datetime
    endTime: datetime
  }],
  closedFrames: [], // holds the same type of frame objects as above
  ui: {
    tabs: {
      snap: string, // "left", "right"
      activeDraggedTab: object,
    },
    navbar: {
      urlbar: {
        location: string, // the string displayed in the urlbar
        urlPreview: string,
        suggestions: {
          activeIndex: number,
          searchResults: array,
          suggestionList: object,
        },
        active: boolean, // whether the user is typing in the urlbar
      }
    }
  },
  searchDetail: {
    searchURL: string, // with replacement var in string: {searchTerms}
    autocompleteURL: string, // ditto re: {searchTerms}
  }
}
```
