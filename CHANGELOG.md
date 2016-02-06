# Changelog

## [0.7.13](https://github.com/brave/browser-laptop/releases/v0.7.13dev)
- Preferences: startup mode, homepage, default search engine, various tab preferences, and privacy settings.  More to come.
- Varioius UI enhnacements.
- Security: Third party cookie blocking option (enabled by default).
- Security: Third party HTTP Referer header blocking option (enabled by default).
- Security: Precautionary only, removed node from ever loading in web views.
- Security: Precautionary Added CSP to UI pages.
- Security: Secure sites now display a lock in title mode.
- Various keyboard shortcuts added, various focus issues fixed, various bugs fixed.
- Context menus copy link location works in more cases now.
- about:newtab, about:about pages implemented.
- Placeholder ads link to a page explaining what they are.
- 2 finger navigation on OS X.
- Cleaned up UI to remove unneeded elements for about: pages.

## [0.7.12](https://github.com/brave/browser-laptop/releases/v0.7.12dev)
- Various crash fixes and window.opener fixes.
- Fix for state saving when an update is applied.
- Fix for update error handling when on a flaky connection.
- Visual indicator for Session Tabs added.
- Installers and updates reduced by ~40%.
- Windows taskbar grouping fix.
- Initial window size is now bigger.
- Various keyboard shortcuts added.
- HTTPS Everywhere fixes.

## [0.7.11](https://github.com/brave/browser-laptop/releases/v0.7.11dev)

- Security fix (Severity: High): Prevent BrowserWindow from navigating to remote content ([#445](https://github.com/brave/browser-laptop/issues/445)). Impact: if the user is tricked into dragging and dropping a malicious link outside of the tab content area, the linked site is loaded outside the webview sandbox and can compromise the user's system.
- Dropped URLs now open tabs instead of opening inside the whole window.
- Fixed a tracking protection problem causing some top level sites to not load.
- Bravery menu options are now easier to understand.
- Context menus re-ordered by importance.
- Various Windows shortcuts added.
- Mouse middle click on a tab now closes the tab.
- About menu dialog now works in Windows.
- Release notes viewer will allow mouse activity for copy/pasting.

## [0.7.10](https://github.com/brave/browser-laptop/releases/v0.7.10dev)

- Added the hamburger menu (top right menu).
- Fixed Windows packaging issues.
- Fixed issues with rendering on some Windows systems causing a black window.

## [0.7.9](https://github.com/brave/browser-laptop/releases/v0.7.9dev)

- UI tweaks.
- Fixed bug in adblock causing some sites not to work.
- Per window session state is now preserved.
- Left / right arrow navigation shortcuts.
- Privacy: Browser level web requests loaded into a segmented in memory only partition.

## [0.7.8](https://github.com/brave/browser-laptop/releases/v0.7.8dev)

- New lighter themed UI.
- Partitioned tabs support for multiple sessions per user.
- Security: Sandbox inserted / replaced iframe.
- More context menu options for copy, cut, paste, and copy link.
- Background tabs now actually open in the background.
- Further adblock optimizations.
- Conditionally shows prev / next tab buttons.
- Checking for updates with no windows open opens a new window.
- Closing a pin attempts now goes to next tab.
- Find in page result count indicator.
- Show security icon while HTTP/HTTPS page loads.
- Various bug fixes.

## [0.7.7](https://github.com/brave/browser-laptop/releases/v0.7.7dev)

- Fixed load time indicator and Windows menus
