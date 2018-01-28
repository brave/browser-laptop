# Component Structure

The UI is made up of a tree like structure of React components.

All [React](https://facebook.github.io/react/) components (with the exception of the top level one named `App`) should extend `ImmutableComponent` which in turn directly extends `React.Component`.
`ImmutableComponent` is meant to be used with [Immutable.js](http://facebook.github.io/immutable-js/) props for data.  State should be sent in from props and components should not attempt to modify state themselves.  Instead they should dispatch actions to one of the stores.
`ImmutableComponent` allows component to figure out if any data has changed more efficiently by doing simple top level equality checks only by implementing React's `shouldComponentUpdate`.

# Hierarchy

- App
  - Renderer
    - Components
      - Navigation
        - [Button]
        - UrlBar
        - html:input
        - UrlBarSuggestions
    - TabPages
      - [TabPage]
    - TabsToolbar
      - Tabs
        - [Tab]
      - TabsToolbarButtons
        - [Button]
    - [Frame]
      - electron:webview

# Glossary

**App:**
This should be the only component which modifies state internally and does not extend `ImmutableComponent`.
It listens to events dispatched from the application store and re-renders the component tree.

**Button:**
Buttons such as back, forward, reload, stop, and new frame.

**Frame:**
Component which wraps and renders electron webviews.

**Main:**
Represents a browser window.

**NavigationBar:**
A collection of page navigation components such as the urlbar and back button.

**Tab:**
An individual tab thumbnail

**Tabs:**
Tab controls

**TabPage:**
An individual tab page.

**TabPages:**
Tab page indicators. There are 6 tabs at most per tab page.
This set of indicators shows you which page you are on and allows you to switch pages.

**TabsToolbarButtons:**
Collection of Buttons for the tab bar.

**UrlBar:**
The URL bar part of the navigation bar.

**UrlBarSuggestions:**
The suggestions that come up from when a user types into the URL bar.

**WindowButton:**
An individual button for window management such as close, maximize, minimize.
