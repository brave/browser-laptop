# Changelog

## [0.13.3](https://github.com/brave/browser-laptop/releases/v0.13.3dev)
- Added a way to export bookmarks. ([#1002](https://github.com/brave/browser-laptop/issues/1002))
- Added preference for background image or gradient for new tab. ([#6965](https://github.com/brave/browser-laptop/issues/6965))
- Added a preference setting to "always allow" full screen view. ([#5979](https://github.com/brave/browser-laptop/issues/5979))
- Added Ecosia as search engine. ([#7158](https://github.com/brave/browser-laptop/issues/7158))
- Added translation for bookmarks manager. ([#7130](https://github.com/brave/browser-laptop/issues/7130))
- Added new verified state for disabled publishers. ([#6974](https://github.com/brave/browser-laptop/issues/6974))
- Fixed lookup in dictionary by context menu. ([#7167](https://github.com/brave/browser-laptop/issues/7167))
- Fixed various UI issues. ([#7181](https://github.com/brave/browser-laptop/issues/7181))
- Fixed 'more bookmarks' menu item. ([#7097](https://github.com/brave/browser-laptop/issues/7097))
- Fixed Brave crash when Brave payment is disabled and enabled frequently. ([#7031](https://github.com/brave/browser-laptop/issues/7031))
- Fixed stutter/odd jump when tab switching with unloaded tabs. ([#6895](https://github.com/brave/browser-laptop/issues/6895))
- Fixed disable close button on tabs if tab size is too small. ([#5431](https://github.com/brave/browser-laptop/issues/5431))
- Fixed viewport regaining focus after closing downloads-bar. ([#3219](https://github.com/brave/browser-laptop/issues/3219))
- Fixed click target for Audio indicator on/off button. ([#1776](https://github.com/brave/browser-laptop/issues/1776))
- Fixed three-finger "Look up" tap. ([#1064](https://github.com/brave/browser-laptop/issues/1064))
- Fixed tabs don't resize with window. ([#100](https://github.com/brave/browser-laptop/issues/100))
- Upgraded to node 7.4.0. ([#7061](https://github.com/brave/browser-laptop/issues/7061))
- Upgrade muon to 2.56.3. ([#7173](https://github.com/brave/browser-laptop/issues/7173))
- Upgrade to Chromium v56.0.2924.76. ([#3681](https://github.com/brave/browser-laptop/issues/3681))


## [0.13.2](https://github.com/brave/browser-laptop/releases/v0.13.2dev)
- Added a way to keep tabs the same size when closing instead of resizing. ([#6088](https://github.com/brave/browser-laptop/issues/6088))
- Added import recovery keys feature for Brave Wallet. ([#4806](https://github.com/brave/browser-laptop/issues/4806))
- Added HTTP auth (login) dialogs which now have a cancel button. ([#6855](https://github.com/brave/browser-laptop/issues/6855))
- Added file open with drag-and-drop. ([#3819](https://github.com/brave/browser-laptop/issues/3819))
- Added keyboard selection for autocomplete.  ([#1302](https://github.com/brave/browser-laptop/issues/1302))
- Added performance improvements (particularly startup time and bookmarks import). ([#6833](https://github.com/brave/browser-laptop/issues/6833))([#4879](https://github.com/brave/browser-laptop/issues/4879))
- Fixed spellcheck on Linux. ([#7015](https://github.com/brave/browser-laptop/issues/7015))([#6967](https://github.com/brave/browser-laptop/issues/6967))
- Fixed Command+Click to open a new tab next to the parent tab. ([#6971](https://github.com/brave/browser-laptop/issues/6971))
- Fixed various UI issues. ([#6812](https://github.com/brave/browser-laptop/issues/6812))([#6806](https://github.com/brave/browser-laptop/issues/6806))([#6867](https://github.com/brave/browser-laptop/issues/6867))([#6754](https://github.com/brave/browser-laptop/issues/6754))([#5494](https://github.com/brave/browser-laptop/issues/5494))
- Fixed various ledger issues. ([#6966](https://github.com/brave/browser-laptop/issues/6966))([#6592](https://github.com/brave/browser-laptop/issues/6592))([#6878](https://github.com/brave/browser-laptop/issues/6878))([#6685](https://github.com/brave/browser-laptop/issues/6685))([#6941](https://github.com/brave/browser-laptop/issues/6941))
- Fixed multiple home page URLs which stopped working - "Your file was not found". ([#6913](https://github.com/brave/browser-laptop/issues/6913))
- Fixed lesechos.fr anti-ad blocking behavior. ([#6879](https://github.com/brave/browser-laptop/issues/6879))
- Fixed tab title display when reloading the page. ([#5738](https://github.com/brave/browser-laptop/issues/5738))
- Fixed autofill suggestion not being dismissed when tabs are switched. ([#6820](https://github.com/brave/browser-laptop/issues/6820))
- Fixed change language to require restart similar to other pref settings. ([#6782](https://github.com/brave/browser-laptop/issues/6782))
- Fixed bookmark hanger items alignment & text blur. ([#6777](https://github.com/brave/browser-laptop/issues/6777))
- Fixed bookmark listing to make it more clickable for adding/editing a bookmark. ([#6704](https://github.com/brave/browser-laptop/issues/6704))
- Fixed apt repository not working for Ubuntu yakkety. ([#6643](https://github.com/brave/browser-laptop/issues/6643))
- Upgrade to muon 2.0.19 ([#7003](https://github.com/brave/browser-laptop/issues/7003))

## [0.13.1](https://github.com/brave/browser-laptop/releases/v0.13.1dev)
- Fixed Widevine not working on Windows (Netflix). ([#6948](https://github.com/brave/browser-laptop/issues/6948))
- Fixed DPI settings on Windows causing blurriness and causing missing pixels.  ([#6462](https://github.com/brave/browser-laptop/issues/6462))
- Fixed high memory usage by temporarily disabling newtab background images.  ([#6945](https://github.com/brave/browser-laptop/issues/6945))
- Upgrade to Muon 2.0.18. ([#6949](https://github.com/brave/browser-laptop/issues/6949))

## [0.13.0](https://github.com/brave/browser-laptop/releases/v0.13.0dev)
- Added WebTorrent support for magnet links. ([#5818](https://github.com/brave/browser-laptop/issues/5818))([#5815](https://github.com/brave/browser-laptop/issues/5815))
- Added Linux sandbox. ([#874](https://github.com/brave/browser-laptop/issues/874))
- Added PDF based payment history contribution statements. ([#4769](https://github.com/brave/browser-laptop/issues/4769))
- Added the revision SHA the source code was built from to about:brave. ([#5462](https://github.com/brave/browser-laptop/issues/5462))
- Added copy to clipboard option for about:brave page. ([#5790](https://github.com/brave/browser-laptop/issues/5790))
- Added a display-text-only mode for bookmark toolbar folders. ([#6078](https://github.com/brave/browser-laptop/issues/6078))
- Optimized UI lag caused by about: pages being open. ([#6715](https://github.com/brave/browser-laptop/issues/6715))
- Optimized URL bar autocomplete to no longer flash when you enter text. ([#6644](https://github.com/brave/browser-laptop/issues/6644))
- Changed "window renderer" processes to no longer include Node (content renderers never did in Brave). ([#6454](https://github.com/brave/browser-laptop/issues/6454))
- Changed Battery Status API to require user permission. ([#1885](https://github.com/brave/browser-laptop/issues/1885))
- Updated localization files. ([#6709]((https://github.com/brave/browser-laptop/issues/6709))
- Fixed Twitter login. ([#4758](https://github.com/brave/browser-laptop/issues/4758))
- Fixed blocking of YouTube ads. ([#4693](https://github.com/brave/browser-laptop/issues/4693))
- Fixed tab switching performance. ([#6715](https://github.com/brave/browser-laptop/issues/6715))
- Fixed drag and drop for tabs. ([#6033](https://github.com/brave/browser-laptop/issues/6033))
- Fixed memory leak causing renderer crashes. ([#6656](https://github.com/brave/browser-laptop/issues/6656))
- Fixed 1Password auto-submit on fill. ([#5875](https://github.com/brave/browser-laptop/issues/5875))
- Fixed focus on tabs keeps "bouncing" back to previous tab. ([#5730](https://github.com/brave/browser-laptop/issues/5730))
- Fixed github drop down for releases page. ([#5213](https://github.com/brave/browser-laptop/issues/5213))
- Fixed `window.onbeforeunload` handling. ([#4079](https://github.com/brave/browser-laptop/issues/4079))
- Fixed labels and buttons in notification bar behavior. ([#6417](https://github.com/brave/browser-laptop/issues/6417))
- Fixed Bookmarks showing wrong folder name. ([#4983](https://github.com/brave/browser-laptop/issues/4983))
- Fixed context menu cut and paste does not change findbar state. ([#5753](https://github.com/brave/browser-laptop/issues/5753))
- Fixed clicking links from emails will sometimes do a search instead of directly following. ([#5911](https://github.com/brave/browser-laptop/issues/5911))
- Fixed numerous issues for Brave Payments. ([#6345](https://github.com/brave/browser-laptop/issues/6345))
- Fixed numerous issues for new tab page. ([#6355](https://github.com/brave/browser-laptop/issues/6355))
- Fixed numerous issues for UI polish. ([#6346](https://github.com/brave/browser-laptop/issues/6346))
- Fixed various security & privacy issues.  ([#6356](https://github.com/brave/browser-laptop/issues/6356))
- Fixed borders and corners of each button on navbar not being clickable. ([#5679](https://github.com/brave/browser-laptop/issues/5679))
- Fixed Geolocations not working on Windows ia32. ([#6331](https://github.com/brave/browser-laptop/issues/6331))
- Upgrade to Chromium 54.0.2840.100. ([#3679](https://github.com/brave/browser-laptop/issues/3679))
- Updated Muon to 2.0.17. ([#6340](https://github.com/brave/browser-laptop/issues/6340))

## [0.12.15](https://github.com/brave/browser-laptop/releases/v0.12.15dev)
- Added Yandex as a new search engine. ([#2703](https://github.com/brave/browser-laptop/issues/2703))
- Added Qwant as a new search engine. ([#2701](https://github.com/brave/browser-laptop/issues/2701))
- Added Semantic Scholar as a new search engine. ([#5656](https://github.com/brave/browser-laptop/issues/5656))
- Changed "Submit Feedback..." link to use community.brave.com. ([#6179](https://github.com/brave/browser-laptop/issues/6179))
- Fixed a Windows installer issue causing shortcuts to try and open brave.exe. ([#6075](https://github.com/brave/browser-laptop/issues/6075))
- Fixed alignment for icons on about pages. ([#6137](https://github.com/brave/browser-laptop/issues/6137))
- Fixed blue line appearing above page contents after some page loads. ([#5661](https://github.com/brave/browser-laptop/issues/5661))
- Moved default zoom level from Advanced to General prefs. ([#5697](https://github.com/brave/browser-laptop/issues/5697))

## [0.12.14](https://github.com/brave/browser-laptop/releases/v0.12.14dev)
- Muon updated to 1.4.31 to address Symantec issued cert problems

## [0.12.13](https://github.com/brave/browser-laptop/releases/v0.12.13dev)
- Typing fast could lead to partial selection inside URL bar. ([#5943](https://github.com/brave/browser-laptop/issues/5943))
- Muon updated to 1.4.29 (Brave's Electron fork)

## [0.12.12](https://github.com/brave/browser-laptop/releases/v0.12.12dev)
- Muon updated to 1.4.28 (Brave's Electron fork)

## [0.12.11](https://github.com/brave/browser-laptop/releases/v0.12.11dev)
- Muon updated to 1.4.27 (Brave's Electron fork)

## [0.12.10](https://github.com/brave/browser-laptop/releases/v0.12.10dev)
- Added dropdown menu with options for new tab. ([#4398](https://github.com/brave/browser-laptop/issues/4398))
- Added F6 jump to url / search bar. ([#4464](https://github.com/brave/browser-laptop/issues/4464))
- Fixed various issues for the new tab page. ([#5337](https://github.com/brave/browser-laptop/issues/5337))([#5703](https://github.com/brave/browser-laptop/issues/5703))([#5735](https://github.com/brave/browser-laptop/issues/5735))([#5666](https://github.com/brave/browser-laptop/issues/5666))([#5511](https://github.com/brave/browser-laptop/issues/5511))
- Fixed various issues for Brave Payments. ([#5606](https://github.com/brave/browser-laptop/issues/5606))([#4981](https://github.com/brave/browser-laptop/issues/4981))
([#5503](https://github.com/brave/browser-laptop/issues/5503))
- Fixed URL not showing on address bar. ([#5629](https://github.com/brave/browser-laptop/issues/5629))
- Fixed autocomplete selection accidents made by mouse position. ([#5612](https://github.com/brave/browser-laptop/issues/5612))
- Fixed UI on Brave shield. ([#5715](https://github.com/brave/browser-laptop/issues/5715))
- Fixed address bar showing chrome-extension:// prefix for PDFs. ([#5725](https://github.com/brave/browser-laptop/issues/5725))
- Fixed imported Bookmarks from showing the Wrong Date and Time. ([#5576](https://github.com/brave/browser-laptop/issues/5576))
- Fixed various UI issues. ([#5497](https://github.com/brave/browser-laptop/issues/5497))([#5476](https://github.com/brave/browser-laptop/issues/5476))([#5094](https://github.com/brave/browser-laptop/issues/5094))([#5680](https://github.com/brave/browser-laptop/issues/5680))([#1594](https://github.com/brave/browser-laptop/issues/1594))([#5695](https://github.com/brave/browser-laptop/issues/5695))([#3651](https://github.com/brave/browser-laptop/issues/3651))([#2178](https://github.com/brave/browser-laptop/issues/2178))([#5610](https://github.com/brave/browser-laptop/issues/5610))([#5652](https://github.com/brave/browser-laptop/issues/5652))([#4812](https://github.com/brave/browser-laptop/issues/4812))
- Fixed Chromium not recognized as a browser for importing bookmarks. ([#5463](https://github.com/brave/browser-laptop/issues/5463))
- Fixed about:brave doesn't show details. ([#5633](https://github.com/brave/browser-laptop/issues/5633))
- Fixed [HackerOne] media permission requests in iframes show top-level origin. ([#5378](https://github.com/brave/browser-laptop/issues/5378))
- Upgrade to muon v1.4.26 ([#5716](https://github.com/brave/browser-laptop/issues/5716))

## [0.12.9](https://github.com/brave/browser-laptop/releases/v0.12.9dev)
- Added New Tab page. ([#3001](https://github.com/brave/browser-laptop/issues/3001))([#2106](https://github.com/brave/browser-laptop/issues/2106))([#5334](https://github.com/brave/browser-laptop/issues/5334))([#5310](https://github.com/brave/browser-laptop/issues/5310))([#5396](https://github.com/brave/browser-laptop/issues/5396))([#5336](https://github.com/brave/browser-laptop/issues/5336))([#5482](https://github.com/brave/browser-laptop/issues/5482))([#5332](https://github.com/brave/browser-laptop/issues/5332))([#5337](https://github.com/brave/browser-laptop/issues/5337))([#5380](https://github.com/brave/browser-laptop/issues/5380))([#5324](https://github.com/brave/browser-laptop/issues/5324))([#5321](https://github.com/brave/browser-laptop/issues/5321))([#5322](https://github.com/brave/browser-laptop/issues/5322))
- Added Password Manager/Extension icon in right click menu. ([#5292](https://github.com/brave/browser-laptop/issues/5292))
- Added infogalactic.com to Search prefs. ([#5475](https://github.com/brave/browser-laptop/issues/5475))
- Added Wolfram Alpha to Search prefs. ([#5478](https://github.com/brave/browser-laptop/issues/5478))
- Fixed various UI issues. ([#5069](https://github.com/brave/browser-laptop/issues/5069))([#5522](https://github.com/brave/browser-laptop/pull/5522))([#5381](https://github.com/brave/browser-laptop/issues/5381))([#5518](https://github.com/brave/browser-laptop/issues/5518))([#5456](https://github.com/brave/browser-laptop/issues/5456))([#4852](https://github.com/brave/browser-laptop/issues/4852))([#5384](https://github.com/brave/browser-laptop/issues/5384))([#5446](https://github.com/brave/browser-laptop/issues/5446))([#4910](https://github.com/brave/browser-laptop/issues/4910))([#5145](https://github.com/brave/browser-laptop/issues/5145))([#5210](https://github.com/brave/browser-laptop/issues/5210))([#5383](https://github.com/brave/browser-laptop/issues/5383))([#5485](https://github.com/brave/browser-laptop/issues/5485))([#5436](https://github.com/brave/browser-laptop/issues/5436))([#5398](https://github.com/brave/browser-laptop/issues/5398))([#5023](https://github.com/brave/browser-laptop/issues/5023))([#5416](https://github.com/brave/browser-laptop/issues/5416))([#5377](https://github.com/brave/browser-laptop/issues/5377))
- Fixed various issues for about:history. ([#5458](https://github.com/brave/browser-laptop/issues/5458))([#5525](https://github.com/brave/browser-laptop/pull/5525))([#5405](https://github.com/brave/browser-laptop/issues/5405))
- Fixed right click when using 1Password or Lastpass. ([#5509](https://github.com/brave/browser-laptop/issues/5509))
- Fixed help link. ([#2902](https://github.com/brave/browser-laptop/issues/2902))
- Fixed various issues for Brave Payments. ([#4920](https://github.com/brave/browser-laptop/issues/4920))([#5418](https://github.com/brave/browser-laptop/issues/5418))([#5299](https://github.com/brave/browser-laptop/issues/5299))([#4274](https://github.com/brave/browser-laptop/issues/4274))([#5343](https://github.com/brave/browser-laptop/issues/5343))([#5200](https://github.com/brave/browser-laptop/issues/5200))([#5473](https://github.com/brave/browser-laptop/issues/5473))([#5402](https://github.com/brave/browser-laptop/issues/5402))
- Fixed [HackerOne] security issues. https://hackerone.com/reports/178379 ([#5238](https://github.com/brave/browser-laptop/issues/5238))
 https://hackerone.com/reports/180234 ([#5447](https://github.com/brave/browser-laptop/issues/5447))
- Fixed address bar suggestions. ([#5313](https://github.com/brave/browser-laptop/issues/5313))([#5315](https://github.com/brave/browser-laptop/issues/5315))
- Fixed Widevine permission notification display. ([#5488](https://github.com/brave/browser-laptop/issues/5488))
- Fixed various issues for bookmarks. ([#4860](https://github.com/brave/browser-laptop/issues/4860))([#5183](https://github.com/brave/browser-laptop/issues/5183))([#5374](https://github.com/brave/browser-laptop/issues/5374))([#5357](https://github.com/brave/browser-laptop/issues/5357))
- Fixed AVG deleting latest update. ([#5241](https://github.com/brave/browser-laptop/issues/5241))
- Fixed when Alt key Reveals Toolbar. ([#4295](https://github.com/brave/browser-laptop/issues/4295))
- Fixed various issues with address bar. ([#5460](https://github.com/brave/browser-laptop/issues/5460))([#5063](https://github.com/brave/browser-laptop/issues/5063))([#5459](https://github.com/brave/browser-laptop/issues/5459))([#5036](https://github.com/brave/browser-laptop/issues/5036))
- Fixed Autofill suggestion closing when form is submit / enter pressed. ([#4540](https://github.com/brave/browser-laptop/issues/4540))
- Fixed Autofill suggestion closing when field is out of focus. ([#3816](https://github.com/brave/browser-laptop/issues/3816))
- Upgraded to muon 1.4.25 ([#5568](https://github.com/brave/browser-laptop/issues/5568))

## [0.12.8](https://github.com/brave/browser-laptop/releases/v0.12.8dev)
- Added Pocket extension. ([#4702](https://github.com/brave/browser-laptop/issues/4702))([#5227](https://github.com/brave/browser-laptop/issues/5227))([#516](https://github.com/brave/browser-laptop/issues/516))([#4689](https://github.com/brave/browser-laptop/issues/4689))([#4700](https://github.com/brave/browser-laptop/issues/4700))([#5226](https://github.com/brave/browser-laptop/issues/5226))
- Added button to view about:extensions from preferences. ([#5244](https://github.com/brave/browser-laptop/issues/5244))
- Added regional adblock filter lists for India. ([#4996](https://github.com/brave/browser-laptop/issues/4996))
- Added search autocomplete for start page search engine. ([#5281](https://github.com/brave/browser-laptop/issues/5281))
- Changed clear data menu items in History menu with new, single item. ([#3093](https://github.com/brave/browser-laptop/issues/3093))
- Changed PDFJS to show in extensions section in preferences ([#5245](https://github.com/brave/browser-laptop/issues/5245))
- Fixed numerous issues for bookmark manager. ([#5183](https://github.com/brave/browser-laptop/issues/5183))([#5331](https://github.com/brave/browser-laptop/pull/5331))([#5223](https://github.com/brave/browser-laptop/issues/5223))([#5249](https://github.com/brave/browser-laptop/issues/5249))([#5148](https://github.com/brave/browser-laptop/issues/5148))([#4860](https://github.com/brave/browser-laptop/issues/4860))
- Fixed numerous issues for Brave Payments. ([#5365](https://github.com/brave/browser-laptop/issues/5365))([#4980](https://github.com/brave/browser-laptop/issues/4980))([#5300](https://github.com/brave/browser-laptop/issues/5300))([#4481](https://github.com/brave/browser-laptop/issues/4481))([#4703](https://github.com/brave/browser-laptop/issues/4703))([#4432](https://github.com/brave/browser-laptop/issues/4432))([#5236](https://github.com/brave/browser-laptop/issues/5236))([#4787](https://github.com/brave/browser-laptop/issues/4787))
- Fixed numerous issues for the Findbar. ([#5363](https://github.com/brave/browser-laptop/issues/5363))([#5340](https://github.com/brave/browser-laptop/issues/5340))([#4975](https://github.com/brave/browser-laptop/issues/4975))([#5317](https://github.com/brave/browser-laptop/issues/5317))([#5247](https://github.com/brave/browser-laptop/issues/5247))([#5289](https://github.com/brave/browser-laptop/issues/5289))([#5286](https://github.com/brave/browser-laptop/issues/5286))
- Fixed submit feedback in pref page/hamburger menu. ([#5352](https://github.com/brave/browser-laptop/issues/5352))
- Fixed Brave open from "Open with" context menu. ([#4795](https://github.com/brave/browser-laptop/issues/4795))
- Fixed double-clicking of entries on about:history. ([#5353](https://github.com/brave/browser-laptop/issues/5353))
- Fixed Right Click doesn't work after logging into LastPass extension. ([#5293](https://github.com/brave/browsr-laptop/issues/5293))
- Fixed 1Password and LastPass repeated entries in right click context menu. ([#5291](https://github.com/brave/browser-laptop/issues/5291))
- Fixed download list is out of order. ([#4484](https://github.com/brave/browser-laptop/issues/4484))
- Fixed address bar drops last 2 characters when typing fast (not related to auto suggestions or history). ([#5189](https://github.com/brave/browser-laptop/issues/5189))
- Fixed Brave crashes when trying to visit www.sweclockers.com. ([#5273](https://github.com/brave/browser-laptop/issues/5273))
- Fixed some cases where favicon is not displayed in history pulldown. ([#2747](https://github.com/brave/browser-laptop/issues/2747))
- Fixed TripAdvisor crashes Brave. ([#5264](https://github.com/brave/browser-laptop/issues/5264))
- Fixed visiting http://expressjs.com/ causes Brave to crash. ([#5270](https://github.com/brave/browser-laptop/issues/5270))
- Fixed drag area above address bar. ([#5225](https://github.com/brave/browser-laptop/issues/5225))
- Fixed navigating back doesn't revert URL to the previous site. ([#5221](https://github.com/brave/browser-laptop/issues/5221))
- Fixed check adblock / TP lists more frequently than daily. ([#5228](https://github.com/brave/browser-laptop/issues/5228))
- Fixed don't show blank urlbar for about:blank. ([#5209](https://github.com/brave/browser-laptop/issues/5209))
- Upgraded to brave/electron 1.4.23. ([#5243](https://github.com/brave/browser-laptop/issues/5243))


## [0.12.7](https://github.com/brave/browser-laptop/releases/v0.12.7dev)
- Added Google Widevine for Netflix support. ([#5131](https://github.com/brave/browser-laptop/issues/5131))([#468](https://github.com/brave/browser-laptop/issues/468))
- Added Startpage search engine. ([#3845](https://github.com/brave/browser-laptop/issues/3845))
- Added the ability to select multiple bookmarks at the same time. ([#5165](https://github.com/brave/browser-laptop/issues/5165))([#1005](https://github.com/brave/browser-laptop/issues/1005))
- Added verified icon for verified publishers ([#3467](https://github.com/brave/browser-laptop/issues/3467))
- Fixed numerous issues for the address bar. ([#4663](https://github.com/brave/browser-laptop/issues/4663))([#5025](https://github.com/brave/browser-laptop/issues/5025))
- Fixed autocomplete. ([#5043](https://github.com/brave/browser-laptop/issues/5043))([#5024](https://github.com/brave/browser-laptop/issues/5024))([#5091](https://github.com/brave/browser-laptop/issues/5091))([#4998](https://github.com/brave/browser-laptop/issues/4998))
- Fixed overzealous ad blocking. ([#4442](https://github.com/brave/browser-laptop/issues/4442))
- Fixed error page behavior. ([#5177](https://github.com/brave/browser-laptop/issues/5177))([#4984](https://github.com/brave/browser-laptop/issues/4984))
- Fixed numerous issues for bookmarks. ([#5202](https://github.com/brave/browser-laptop/issues/5202))([#5103](https://github.com/brave/browser-laptop/issues/5103))([#5032](https://github.com/brave/browser-laptop/issues/5032))
- Fixed Brave Payment wallet creation. ([#5107](https://github.com/brave/browser-laptop/issues/5107))
- Fixed remembering window position. ([#3247](https://github.com/brave/browser-laptop/issues/3247))
- Fixed fullscreen display on Windows. ([#5152](https://github.com/brave/browser-laptop/issues/5152))
- Fixed window resizing. ([#586](https://github.com/brave/browser-laptop/issues/586))
- Fixed UI for forms in app. ([#4884](https://github.com/brave/browser-laptop/issues/4884))
- Fixed Brave Payments showing wrong contribution date. ([#4058](https://github.com/brave/browser-laptop/issues/4058))
- Fixed security issue : local file read-access. ([#4906](https://github.com/brave/browser-laptop/issues/4906))
- Fixed security issue : closing windows via scripts. ([#5006](https://github.com/brave/browser-laptop/issues/5006))
- Updated to brave/electron 1.4.20. ([#5188](https://github.com/brave/browser-laptop/issues/5188))

## [0.12.6](https://github.com/brave/browser-laptop/releases/v0.12.6dev)
- Added the ability to set Brave as your default browser on startup and preferences page. ([#4937](https://github.com/brave/browser-laptop/issues/4937))([#4958](https://github.com/brave/browser-laptop/issues/4958))([#4935](https://github.com/brave/browser-laptop/issues/4935))([#4934](https://github.com/brave/browser-laptop/issues/4934))([#2105](https://github.com/brave/browser-laptop/issues/2105))([#4939](https://github.com/brave/browser-laptop/issues/4939))
- Added the option to opt-in to reporting usage stats. ([#4691](https://github.com/brave/browser-laptop/issues/4691))
- Fixed various security issues. ([#4747](https://github.com/brave/browser-laptop/issues/4747))([#4885](https://github.com/brave/browser-laptop/issues/4885))([#4913](https://github.com/brave/browser-laptop/issues/4913))([#4883](https://github.com/brave/browser-laptop/issues/4883))
- Fixed error on invalid homepage URL. ([#4974](https://github.com/brave/browser-laptop/issues/4974))
- Fixed Autocomplete handling so it works better. ([#3049](https://github.com/brave/browser-laptop/issues/3049))([#3235](https://github.com/brave/browser-laptop/issues/3235))([#4861](https://github.com/brave/browser-laptop/issues/4861))
- Fixed Favicons not being loaded when bookmarks imported from other browsers. ([#4882](https://github.com/brave/browser-laptop/issues/4882))
- Fixed Bookmarks bar select element should not be disabled. ([#4936](https://github.com/brave/browser-laptop/issues/4936))
- Fixed blocking `*`y.ai sites from being accidentally blocked. ([#4938](https://github.com/brave/browser-laptop/issues/4938))
- Fixed various UI issues. ([#4923](https://github.com/brave/browser-laptop/issues/4923))([#4897](https://github.com/brave/browser-laptop/issues/4897))([#4814](https://github.com/brave/browser-laptop/issues/4814))([#4817](https://github.com/brave/browser-laptop/issues/4817))([#4866](https://github.com/brave/browser-laptop/issues/4866))([#4855](https://github.com/brave/browser-laptop/issues/4855))([#3282](https://github.com/brave/browser-laptop/issues/3282))([#2894](https://github.com/brave/browser-laptop/issues/2894))([#4864](https://github.com/brave/browser-laptop/issues/4864))([#4854](https://github.com/brave/browser-laptop/issues/4854))([#3008](https://github.com/brave/browser-laptop/issues/3008))([#4830](https://github.com/brave/browser-laptop/issues/4830))([#3604](https://github.com/brave/browser-laptop/issues/3604))([#4648](https://github.com/brave/browser-laptop/issues/4648))([#4810](https://github.com/brave/browser-laptop/issues/4810))([#4766](https://github.com/brave/browser-laptop/issues/4766))([#4836](https://github.com/brave/browser-laptop/issues/4836))([#4790](https://github.com/brave/browser-laptop/issues/4790))
- Fixed double-clicking of entries on about:history opening a blank new tab. ([#4909](https://github.com/brave/browser-laptop/issues/4909))
- Fixed Pressing Tab, then Enter in address bar unexpectedly minimizing window on Windows. ([#4846](https://github.com/brave/browser-laptop/issues/4846))
- Fixed address bar suggestions not working if you are offline. ([#3730](https://github.com/brave/browser-laptop/issues/3730))
- Fixed error tab cannot be reloaded or cloned. ([#2826](https://github.com/brave/browser-laptop/issues/2826))
- Fixed buttons to add bookmark / bookmark folder in about:bookmarks. ([#4684](https://github.com/brave/browser-laptop/issues/4684))
- Upgraded to brave/electrton 1.4.16. ([#4954](https://github.com/brave/browser-laptop/issues/4954))

## [0.12.5](https://github.com/brave/browser-laptop/releases/v0.12.5dev)
- Added Brave Wallet backup and recovery. ([#4743](https://github.com/brave/browser-laptop/issues/4743))([#3350](https://github.com/brave/browser-laptop/issues/3350))
- Added a way for users to opt-out of crash reporting. ([#4479](https://github.com/brave/browser-laptop/issues/4479))
- Added multi-select deletion and drag and drop in about:history. ([#3949](https://github.com/brave/browser-laptop/issues/3949))([#4741](https://github.com/brave/browser-laptop/issues/4741))
- Fixed Linux install for RPM installers. ([#3774](https://github.com/brave/browser-laptop/issues/3774))([#1445](https://github.com/brave/browser-laptop/issues/1445))
- Fixed autocomplete on URL bar. ([#4731](https://github.com/brave/browser-laptop/issues/4731))([#4360](https://github.com/brave/browser-laptop/issues/4360))([#4573](https://github.com/brave/browser-laptop/issues/4573))
- Fixed clearing autofill. ([#4818](https://github.com/brave/browser-laptop/issues/4818))
- Fixed 'about' sites in the address bar. ([#4824](https://github.com/brave/browser-laptop/issues/4824))
- Fixed custom filter list to stop using spell check. ([#4619](https://github.com/brave/browser-laptop/issues/4619))
- Fixed numerous issues for Bookmarks Manager. ([#4739](https://github.com/brave/browser-laptop/issues/4739))([#4685](https://github.com/brave/browser-laptop/issues/4685))([#4751](https://github.com/brave/browser-laptop/issues/4751))([#2652](https://github.com/brave/browser-laptop/issues/2652))([#4728](https://github.com/brave/browser-laptop/issues/4728))([#1994](https://github.com/brave/browser-laptop/issues/1994))([#4523](https://github.com/brave/browser-laptop/issues/4523))([#4562](https://github.com/brave/browser-laptop/issues/4562))
- Fixed some Yahoo ads not being blocked on yahoo.co.jp. ([#4762](https://github.com/brave/browser-laptop/issues/4762))
- Fixed bookmarks from Edge not Importing. ([#4679](https://github.com/brave/browser-laptop/issues/4679))
- Fixed various issues for the Bookmarks Toolbar. ([#4614](https://github.com/brave/browser-laptop/issues/4614))([#3356](https://github.com/brave/browser-laptop/issues/3356))([#1725](https://github.com/brave/browser-laptop/issues/1725))
- Fixed right Alt key opening menubar for Windows users. ([#4626](https://github.com/brave/browser-laptop/issues/4626))
- Fixed the ability to change default search via preferences. ([#4695](https://github.com/brave/browser-laptop/issues/4695))
- Fixed various UI issues in Brave Payments. ([#4292](https://github.com/brave/browser-laptop/issues/4292))([#4605](https://github.com/brave/browser-laptop/issues/4605))([#4537](https://github.com/brave/browser-laptop/issues/4537))([#4566](https://github.com/brave/browser-laptop/issues/4566))
- Fixed address display on about:autofill. ([#4349](https://github.com/brave/browser-laptop/issues/4349))
- Fixed adblock list blocking elements other than ads too. ([#4633](https://github.com/brave/browser-laptop/issues/4633))
- Update adblock definition files. ([#3087](https://github.com/brave/browser-laptop/issues/3087))
- Updated to brave/electron 1.4.14. ([#4767](https://github.com/brave/browser-laptop/issues/4767))

## [0.12.4](https://github.com/brave/browser-laptop/releases/v0.12.4dev)
- Added regional adblocking (Access via about:adblock or in preferences). These are special rules which focus on blocking ads for non-US sites. ([#4489](https://github.com/brave/browser-laptop/issues/4489))([#1357](https://github.com/brave/browser-laptop/issues/1357))
- Added the ability to define custom adblock rules. ([#4620](https://github.com/brave/browser-laptop/issues/4620))
- Added bravery panel settings for private tabs. ([#4468](https://github.com/brave/browser-laptop/issues/4468))([#1824](https://github.com/brave/browser-laptop/issues/1824))
- Added Bookmark This Page option to context menu. ([#3807](https://github.com/brave/browser-laptop/issues/3807))
- Added the ability to clear site exceptions. ([#4174](https://github.com/brave/browser-laptop/issues/4174))([#4134](https://github.com/brave/browser-laptop/issues/4134))
- Fixed scrolling. ([#4472](https://github.com/brave/browser-laptop/issues/4472))
- Fixed flickering on error pages. ([#4502](https://github.com/brave/browser-laptop/issues/4502))
- Fixed various things for Brave Payments. ([#3888](https://github.com/brave/browser-laptop/issues/3888))([#4521](https://github.com/brave/browser-laptop/issues/4521))([#4528](https://github.com/brave/browser-laptop/issues/4528))([#4461](https://github.com/brave/browser-laptop/issues/4461))([#4058](https://github.com/brave/browser-laptop/issues/4058))([#4516](https://github.com/brave/browser-laptop/issues/4516))([#4421](https://github.com/brave/browser-laptop/issues/4421))([#4395](https://github.com/brave/browser-laptop/issues/4395))([#4333](https://github.com/brave/browser-laptop/issues/4333))([#4212](https://github.com/brave/browser-laptop/issues/4212))([#4436](https://github.com/brave/browser-laptop/issues/4436))([#4332](https://github.com/brave/browser-laptop/issues/4332))([#4340](https://github.com/brave/browser-laptop/issues/4340))([#4514](https://github.com/brave/browser-laptop/issues/4514))
- Fixed flickering on hover. ([#4518](https://github.com/brave/browser-laptop/issues/4518))
- Fixed Flash playing in a private tab. ([#3835](https://github.com/brave/browser-laptop/issues/3835))([#3998](https://github.com/brave/browser-laptop/issues/3998))
- Fixed crashing when tabs are closed. ([#4290](https://github.com/brave/browser-laptop/issues/4290))([#3760](https://github.com/brave/browser-laptop/issues/3760))
- Fixed localized dates. ([#4294](https://github.com/brave/browser-laptop/issues/4294))
- Fixed various style issues. ([#4512](https://github.com/brave/browser-laptop/issues/4512))([#4513](https://github.com/brave/browser-laptop/issues/4513))([#4524](https://github.com/brave/browser-laptop/issues/4524))([#4493](https://github.com/brave/browser-laptop/issues/4493))([#4492](https://github.com/brave/browser-laptop/issues/4492))([#4400](https://github.com/brave/browser-laptop/issues/4400))([#4342](https://github.com/brave/browser-laptop/issues/4342))([#4072](https://github.com/brave/browser-laptop/issues/4072))([#3996](https://github.com/brave/browser-laptop/issues/3996))([#4216](https://github.com/brave/browser-laptop/issues/4216))([#4503](https://github.com/brave/browser-laptop/issues/4503))
- Fixed window size being saved. ([#3754](https://github.com/brave/browser-laptop/issues/3754))([#4385](https://github.com/brave/browser-laptop/issues/4385))([#4482](https://github.com/brave/browser-laptop/issues/4482))
- Fixed bookmarks menu update. ([#4227](https://github.com/brave/browser-laptop/issues/4227))([#3968](https://github.com/brave/browser-laptop/issues/3968))([#4390](https://github.com/brave/browser-laptop/issues/4390))
- Fixed shortcut creation on update. ([#1181](https://github.com/brave/browser-laptop/issues/1181))
- Fixed Submit Feedback link. ([#4487](https://github.com/brave/browser-laptop/issues/4487))
- Fixed exiting fullscreen with UI buttons. ([#4416](https://github.com/brave/browser-laptop/issues/4416))([#4463](https://github.com/brave/browser-laptop/issues/4463))
- Fixed autofill when opened from about:about. ([#4350](https://github.com/brave/browser-laptop/issues/4350))([#4357](https://github.com/brave/browser-laptop/issues/4357))
- Fixed various history issues. ([#4488](https://github.com/brave/browser-laptop/issues/4488))
- Fixed favicons showing and hiding on bookmarks toolbar. ([#4339](https://github.com/brave/browser-laptop/issues/4339))([#4345](https://github.com/brave/browser-laptop/issues/4345))
- Fixed selecting text on a page opened in a new tab. ([#4517](https://github.com/brave/browser-laptop/issues/4517))
- Upgraded to libchromiumcontent 53.0.2785.143. ([#4618](https://github.com/brave/browser-laptop/issues/4618))

## [0.12.3](https://github.com/brave/browser-laptop/releases/v0.12.3dev)
- Added the ability to import data from other browsers. ([#428](https://github.com/brave/browser-laptop/issues/428))([#4049](https://github.com/brave/browser-laptop/issues/4049))([#4154](https://github.com/brave/browser-laptop/issues/4154))
- Added a new look for the Windows browser to remove the titlebar for more content viewing area. ([#3854](https://github.com/brave/browser-laptop/issues/3854))
- Added auto updating extensions ([#4080](https://github.com/brave/browser-laptop/issues/4080))
- Added the ability to install extensions remotely instead of prepackaging them. ([#4081](https://github.com/brave/browser-laptop/issues/4081))
- Added search shortcuts for MDN, GitHub, and Stack Overflow. ([#4213](https://github.com/brave/browser-laptop/issues/4213))
- Added the option to clear site-specific settings. ([#2545](https://github.com/brave/browser-laptop/issues/2545))
- Added instant search results for bookmarks. ([#4097](https://github.com/brave/browser-laptop/issues/4097))([#2778](https://github.com/brave/browser-laptop/issues/2778))
- Fixed various things for importing data from other browsers. ([#4275](https://github.com/brave/browser-laptop/issues/4275))([#4293](https://github.com/brave/browser-laptop/issues/4293))([#4291](https://github.com/brave/browser-laptop/issues/4291))([#4270](https://github.com/brave/browser-laptop/issues/4270))([#4271](https://github.com/brave/browser-laptop/issues/4271))
- Fixed various things for the Address bar. ([#4309](https://github.com/brave/browser-laptop/issues/4309)) ([#4303](https://github.com/brave/browser-laptop/issues/4303))([#4315](https://github.com/brave/browser-laptop/issues/4315))([#4273](https://github.com/brave/browser-laptop/issues/4273))
- Fixed various things for the toolbar. ([#4306](https://github.com/brave/browser-laptop/issues/4306))([#4272](https://github.com/brave/browser-laptop/issues/4272))([#1046](https://github.com/brave/browser-laptop/issues/1046))([#4126](https://github.com/brave/browser-laptop/issues/4126))
- Fixed various things for the titlebar. ([#4188](https://github.com/brave/browser-laptop/issues/4284))([#4175](https://github.com/brave/browser-laptop/issues/4175))([#4144](https://github.com/brave/browser-laptop/issues/4144))([#4296](https://github.com/brave/browser-laptop/issues/4296))([#4235](https://github.com/brave/browser-laptop/issues/4235))
- Fixed various things for Brave Payments. ([#4038](https://github.com/brave/browser-laptop/issues/4038))([#3781](https://github.com/brave/browser-laptop/issues/3781))([#4046](https://github.com/brave/browser-laptop/issues/4046))([#4057](https://github.com/brave/browser-laptop/issues/4057))([#3963](https://github.com/brave/browser-laptop/issues/3963))([#4040](https://github.com/brave/browser-laptop/issues/4040))([#4043](https://github.com/brave/browser-laptop/issues/4043))([#4071](https://github.com/brave/browser-laptop/issues/4071))([#4068](https://github.com/brave/browser-laptop/issues/4068))([#4067](https://github.com/brave/browser-laptop/issues/4067))([#4039](https://github.com/brave/browser-laptop/issues/4039))([#3792](https://github.com/brave/browser-laptop/issues/3792))([#4032](https://github.com/brave/browser-laptop/issues/4032))([#3759](https://github.com/brave/browser-laptop/issues/3759))([#4132](https://github.com/brave/browser-laptop/issues/4132)) ([#4058](https://github.com/brave/browser-laptop/issues/4058))([#4085](https://github.com/brave/browser-laptop/issues/4085))([#4314](https://github.com/brave/browser-laptop/issues/4314))([#3477](https://github.com/brave/browser-laptop/issues/3477))([#4312](https://github.com/brave/browser-laptop/issues/4312))([#4316](https://github.com/brave/browser-laptop/issues/4316))
- Fixed browser history sorting. ([#4047](https://github.com/brave/browser-laptop/issues/4047))
- Fixed browser history listing. ([#4048](https://github.com/brave/browser-laptop/issues/4048))([#4029](https://github.com/brave/browser-laptop/issues/4029))
- Fixed redirection on Twitter when blocking scripts. ([#2884](https://github.com/brave/browser-laptop/issues/2884))
- Fixed viewing source on SVG files. ([#4056](https://github.com/brave/browser-laptop/issues/4056))
- Fixed viewing source during private sessions. ([#4077](https://github.com/brave/browser-laptop/issues/4077))
- Fixed language sorting. ([#4055](https://github.com/brave/browser-laptop/issues/4055))
- Fixed HTTPS count from being shown even when its disabled. ([#4300](https://github.com/brave/browser-laptop/issues/4300))
- Fixed geolocation. ([#3825](https://github.com/brave/browser-laptop/issues/3825))
- Fixed left-right gesture for navigation. ([#2548](https://github.com/brave/browser-laptop/issues/2548))([#4064](https://github.com/brave/browser-laptop/issues/4064))
- Fixed deleting bookmark folders and their contents. ([#4124](https://github.com/brave/browser-laptop/issues/4124))
- Fixed deleted bookmark items from showing in URL suggestions. ([#3763](https://github.com/brave/browser-laptop/issues/3763))
- Fixed search engine selection. ([#4099](https://github.com/brave/browser-laptop/issues/4099))
- Security: Fixed unsafe use of first party url. ([#4145](https://github.com/brave/browser-laptop/issues/4145))([#4137](https://github.com/brave/browser-laptop/issues/4137))
- Fixed showing top panel in fullscreen on mouse over. ([#4193](https://github.com/brave/browser-laptop/issues/4193))([#4234](https://github.com/brave/browser-laptop/issues/4234))
- Updated translations. ([#4308](https://github.com/brave/browser-laptop/issues/4308))
- Upgraded to libchromiumcontent 53.0.2785.116. ([#1593](https://github.com/brave/browser-laptop/issues/1593))

## [0.12.1](https://github.com/brave/browser-laptop/releases/v0.12.1dev)
 - Added support for extension action buttons for password managers. ([#3867](https://github.com/brave/browser-laptop/issues/3867))([#2224](https://github.com/brave/browser-laptop/issues/2224))
 - Added notification to let users know 24 hours before their wallet would be used to pay publishers. ([#3828](https://github.com/brave/browser-laptop/issues/3828))
 - Added about:extensions page. ([#3926](https://github.com/brave/browser-laptop/issues/3926))
 - Added clear Autofill option. ([#3458](https://github.com/brave/browser-laptop/issues/3458))
 - Added notification in Brave Payments to inform user of their contribution day. ([#3801](https://github.com/brave/browser-laptop/issues/3801))
 - Added support for 7 languages: Chinese, Malay, Basque, Italian, Korean, Polish, and Russian. ([#3843](https://github.com/brave/browser-laptop/issues/3843))([#3957](https://github.com/brave/browser-laptop/issues/3957))
 - Fixed numerous things for Brave Payments. ([#3711](https://github.com/brave/browser-laptop/issues/3711))([#3612](https://github.com/brave/browser-laptop/issues/3612))([#3785](https://github.com/brave/browser-laptop/issues/3785))([#3852](https://github.com/brave/browser-laptop/issues/3852))([#3716](https://github.com/brave/browser-laptop/issues/3716))([#3778](https://github.com/brave/browser-laptop/issues/3778))([#3830](https://github.com/brave/browser-laptop/issues/3830))([#3805](https://github.com/brave/browser-laptop/issues/3805))([#3824](https://github.com/brave/browser-laptop/issues/3824))([#3831](https://github.com/brave/browser-laptop/issues/3831))
 - Fixed numerous things in the UI. ([#3910](https://github.com/brave/browser-laptop/issues/3910))([#3916](https://github.com/brave/browser-laptop/issues/3916))([#3908](https://github.com/brave/browser-laptop/issues/3908))([#3856](https://github.com/brave/browser-laptop/issues/3856))([#3622](https://github.com/brave/browser-laptop/issues/3622))([#3673](https://github.com/brave/browser-laptop/issues/3673))([#3708](https://github.com/brave/browser-laptop/issues/3708))([#3739](https://github.com/brave/browser-laptop/issues/3739))([#3855](https://github.com/brave/browser-laptop/issues/3855))([#3629](https://github.com/brave/browser-laptop/issues/3629))([#3813](https://github.com/brave/browser-laptop/issues/3813))([#3612](https://github.com/brave/browser-laptop/issues/3621))([#3833](https://github.com/brave/browser-laptop/issues/3833))([#3677](https://github.com/brave/browser-laptop/issues/3677))([#3803](https://github.com/brave/browser-laptop/issues/3803))([#3484](https://github.com/brave/browser-laptop/issues/3484))([#3940](https://github.com/brave/browser-laptop/issues/3940))
 - Fixed typing in the address bar. ([#3928](https://github.com/brave/browser-laptop/issues/3928))([#3927](https://github.com/brave/browser-laptop/issues/3927))([#3857](https://github.com/brave/browser-laptop/issues/3857))([#3718](https://github.com/brave/browser-laptop/issues/3718))([#3712](https://github.com/brave/browser-laptop/issues/3712))([#3933](https://github.com/brave/browser-laptop/issues/3933))
 - Fixed Autocomplete for Twitter login. ([#3915](https://github.com/brave/browser-laptop/issues/3915))
 - Fixed 1Password not filling the form and Brave saving the password. ([#3897](https://github.com/brave/browser-laptop/issues/3897))
 - Fixed enabling "Web notifications" on Twitter. ([#3579](https://github.com/brave/browser-laptop/issues/3579))
 - Fixed Brave crash when Dashlane password manager is selected. ([#3909](https://github.com/brave/browser-laptop/issues/3909))
 - Fixed crash when Linux users would check for updates. ([#3907](https://github.com/brave/browser-laptop/issues/3907))
 - Fixed Redhat desktop launcher. ([#3905](https://github.com/brave/browser-laptop/issues/3905))
 - Fixed setting Brave as the default browser under Linux. ([#3776](https://github.com/brave/browser-laptop/issues/3776))
 - Fixed privacy retention for new tabs opened via context menu actions. ([#3662](https://github.com/brave/browser-laptop/issues/3662))([#3895](https://github.com/brave/browser-laptop/issues/3895))
 - Fixed a LastPass create account issue. ([#2936](https://github.com/brave/browser-laptop/issues/2936))
 - Fixed renderer crash after signing into `https://*.slack.com/home`. ([#3841](https://github.com/brave/browser-laptop/issues/3841))
 - Fixed mixed content pages incorrectly showing as secure in private browsing mode. ([#3793](https://github.com/brave/browser-laptop/issues/3793))([#3795](https://github.com/brave/browser-laptop/issues/3795))
 - Fixed Mixed-content lock control to re-lock and reload the page. ([#3770](https://github.com/brave/browser-laptop/issues/3770))([#3808](https://github.com/brave/browser-laptop/issues/3808))
 - Fixed Mac menu being inaccessible while download is in progress. ([#3823](https://github.com/brave/browser-laptop/issues/3823))
 - Fixed CmdOrCtrl+T (New Tab) shortcut becoming disabled while navigation occurs. ([#3782](https://github.com/brave/browser-laptop/issues/3782))
 - Changed '...' to Unicode ellipsis. ([#3675](https://github.com/brave/browser-laptop/issues/3675))

## [0.12.0](https://github.com/brave/browser-laptop/releases/v0.12.0dev)
 - Added an option to temporarily disable mixed content protection enhancement security. ([#3443](https://github.com/brave/browser-laptop/issues/3443))
 - Added shortcut to view page source. ([#3685](https://github.com/brave/browser-laptop/issues/3685))
 - Added missing context menu shortcut labels for Bookmarking and Reloading pages. ([#3707](https://github.com/brave/browser-laptop/issues/3707))
 - Changed friendlier add funds panel for users without a bitcoin: handler. ([#3623](https://github.com/brave/browser-laptop/issues/3623))
 - Fixed autofill popup dismissal when you tab out. ([#3709](https://github.com/brave/browser-laptop/pull/3709))
 - Fixed 'Open all in tabs' context menu option in Bookmarks Manager. ([#3614](https://github.com/brave/browser-laptop/issues/3614))
 - Fixed creating a wallet with a monthly allowance > $5 causes Brave to crash. ([#3742](https://github.com/brave/browser-laptop/issues/3742))([#3742](https://github.com/brave/browser-laptop/issues/3672))
 - Fixed wrong suggestions appearing in the autocomplete list under URL bar. ([#3643](https://github.com/brave/browser-laptop/issues/3643))
 - Fixed problems with hangouts on inbox.google.com and mail.google.com when shields are up. ([#3704](https://github.com/brave/browser-laptop/issues/3704))([#3704](https://github.com/brave/browser-laptop/issues/3704))
 - Fixed time spent on page calculation for ledger when Brave is in the background. ([#3650](https://github.com/brave/browser-laptop/issues/3650))
 - Fixed potential race condition on session state save ([#3543](https://github.com/brave/browser-laptop/issues/3543))
 - Fixed bookmark custom title from previously bookmarked entry is no longer re-used when it is removed. ([#3641](https://github.com/brave/browser-laptop/issues/3641))
 - Fixed many things for Brave Payments. ([#3697](https://github.com/brave/browser-laptop/issues/3697))([#3625](https://github.com/brave/browser-laptop/issues/3625))([#3613](https://github.com/brave/browser-laptop/issues/3613))([#3703](https://github.com/brave/browser-laptop/issues/3703))
 - Fixed spelling for Ukrainian interface. ([#3695](https://github.com/brave/browser-laptop/issues/3695))
 - Fixed localization for password strings. ([#3671](https://github.com/brave/browser-laptop/issues/3671))
 - Fixed found entries on about:history cannot be deleted. ([#3566](https://github.com/brave/browser-laptop/issues/3566))
 - Fixed bookmarked pages not deleted from history after restarting bookmarks. ([#3616](https://github.com/brave/browser-laptop/issues/3616))
 - Fixed clear the last accessed time for all tags when clearing history. ([#3620](https://github.com/brave/browser-laptop/issues/3620))
 - Fixed about:history showing bookmarks when searched. ([#3627](https://github.com/brave/browser-laptop/issues/3627))

## [0.11.6](https://github.com/brave/browser-laptop/releases/v0.11.6dev)
 - Added the ability to pay publishers with the Brave Payments. ([#3195](https://github.com/brave/browser-laptop/issues/3195))
 - Added form autofill support. ([#860](https://github.com/brave/browser-laptop/issues/860))
 - Added about:history and Ctrl +Y to bring it up. ([#444](https://github.com/brave/browser-laptop/issues/444))
 - Added new look for find bar UI. ([#3159](https://github.com/brave/browser-laptop/issues/3159))
 - Added bookmarks into the bookmarks menu. ([#1993](https://github.com/brave/browser-laptop/issues/1993))
 - Optimized HTTPS Everywhere. ([#3215](https://github.com/brave/browser-laptop/issues/3215))
 - Changed Hamburger Menu with layout. ([#3003](https://github.com/brave/browser-laptop/issues/3003))
 - Changed Back button history does not hint at options beyond a certain point. ([#2889](https://github.com/brave/browser-laptop/issues/2889))
 - Fixed default engine display problem for fresh profile. ([#3275](https://github.com/brave/browser-laptop/issues/3275))
 - Fixed Address bar input ignored if no default search engine set. ([#3254](https://github.com/brave/browser-laptop/issues/3254))
 - Fixed URL bar autocomplete mouseover does not interfere with typed URL. ([#3225](https://github.com/brave/browser-laptop/issues/3225))
 - Fixed ETags for data file downloading haven't been working. ([#3222](https://github.com/brave/browser-laptop/issues/3222))
 - Fixed Modals being clipped when the window is narrow. ([#3575](https://github.com/brave/browser-laptop/issues/3575))
 - Fixed Application icon is with poor resolution on Linux. ([#3229](https://github.com/brave/browser-laptop/issues/3229))
 - Fixed new tab button too high. ([#3208](https://github.com/brave/browser-laptop/issues/3208))
 - Fixed new tab button position fixes #3208. ([#3213](https://github.com/brave/browser-laptop/issues/3213))
 - Fixed flash on http://www.y8.com/games/superfighters does not work. ([#3082](https://github.com/brave/browser-laptop/issues/3082))
 - Fixed Users can create bookmark folders with no name. ([#3188](https://github.com/brave/browser-laptop/issues/3188))
 - Fixed Back/Forward navigation, tab shows page URL instead of page title. ([#3200](https://github.com/brave/browser-laptop/issues/3200))
 - Fixed NoScript version of DuckDuckGo should be used when NoScript is on. ([#3189](https://github.com/brave/browser-laptop/issues/3189))
 - Fixed Use NoScript state per site instead of blocking scripts. ([#3205](https://github.com/brave/browser-laptop/issues/3205))
 - Fixed Market graph on wsj.com. ([#2102](https://github.com/brave/browser-laptop/issues/2102))
 - Fixed tab-specific notifications should be closed when tab is closed. ([#3169](https://github.com/brave/browser-laptop/issues/3169))
 - Fixed Brave can't handle URLs with whitespace in it. ([#3167](https://github.com/brave/browser-laptop/issues/3167))
 - Fixed Regenerating menu too often. ([#3022](https://github.com/brave/browser-laptop/issues/3022))
 - Fixed Bookmarks flow for sites without titles. ([#3442](https://github.com/brave/browser-laptop/issues/3442))
 - Fixed opening files instead of searching for them. ([#3296](https://github.com/brave/browser-laptop/issues/3296))
 - Fixed Pressing backspace while typing makes the browser go to the previous page on some pages. ([#3496](https://github.com/brave/browser-laptop/issues/3496))
 - Fixed username and password field for basic auth dialog not showing up. ([#3578](https://github.com/brave/browser-laptop/issues/3578))
 - Fixed after upgrade, context menu for password manager was not showing. ([#3549](https://github.com/brave/browser-laptop/issues/3549))
 - Fixed passwords are not saved using default settings. ([#3516](https://github.com/brave/browser-laptop/issues/3516))
 - Upgraded to HTTPS Everywhere 5.2.0. ([#2581](https://github.com/brave/browser-laptop/issues/2581))

## [0.11.5](https://github.com/brave/browser-laptop/releases/v0.11.5dev)
- Fixed a top crasher. ([#3054](https://github.com/brave/browser-laptop/issues/3054))
- Fixed parts of the UI that was not getting translated for different locales. ([#2638](https://github.com/brave/browser-laptop/issues/2638))
- Fixed URL bar sometimes clearing if you type very fast when a new tab is opened. ([#2812](https://github.com/brave/browser-laptop/issues/2812))
- Fixed the possibility to have a blank tab set when closing a tab under some cases ([#3092](https://github.com/brave/browser-laptop/issues/3092))
- Fixed DuckDuckGo URL to use the NoScript version when NoScript is on. ([#3118](https://github.com/brave/browser-laptop/issues/3118))
- Fixed cloned tabs ordering, it will now appear next to the original one ([#2779](https://github.com/brave/browser-laptop/issues/2779))
- Fixed needing to press Esc two times to clear typing. ([#3088](https://github.com/brave/browser-laptop/issues/3088))
- Fixed Flash click to play on Google docs. ([#3090](https://github.com/brave/browser-laptop/issues/3090))
- Fixed restart notification in the preferences page so it doesn't show if you toggle a pref on / off. ([#2958](https://github.com/brave/browser-laptop/issues/2958))

## [0.11.4](https://github.com/brave/browser-laptop/releases/v0.11.4dev)
- Added a clear browsing data now button in preferences and popup panel with clearing options. ([#2471](https://github.com/brave/browser-laptop/issues/2471))
- Added tab page previews. ([#1424](https://github.com/brave/browser-laptop/issues/1424))
- Changed Accept-Encoding to advertise it supports Brotli compression. ([#2890](https://github.com/brave/browser-laptop/issues/2890))
- Fixed printing on Windows. ([#1616](https://github.com/brave/browser-laptop/issues/1616))
- Fixed some memory leaks. ([#3030](https://github.com/brave/browser-laptop/issues/3030))
- Fixed Flash placeholder sometimes not showing. ([#3047](https://github.com/brave/browser-laptop/issues/3047))
- Fixed Spotify WebPlayer. ([#3011](https://github.com/brave/browser-laptop/issues/3011))
- Fixed a common Brave crasher. ([#1954](https://github.com/brave/browser-laptop/issues/1954))
- Fixed closing an inactive tab should not change the active tab. ([#2923](https://github.com/brave/browser-laptop/issues/2923))
- Fixed PDFJS error when clicking on a dropbox file. ([#3056](https://github.com/brave/browser-laptop/issues/3056))

## [0.11.3](https://github.com/brave/browser-laptop/releases/v0.11.3dev)
- Fix URL bar problem from no default search engine. ([#2956](https://github.com/brave/browser-laptop/issues/2956))
- Fix PDF downloading with File > Save Page as. ([#2954](https://github.com/brave/browser-laptop/issues/2954))
- Fix NoScript should not take effect when shields are down. ([#2950](https://github.com/brave/browser-laptop/issues/2950))
- Fix undefined error popup caused by zoomed page upgrading. ([#2989](https://github.com/brave/browser-laptop/issues/2989))
- Upgraded to libchromiumcontent 52.0.2743.116. ([#2964](https://github.com/brave/browser-laptop/issues/2964))

## [0.11.2](https://github.com/brave/browser-laptop/releases/v0.11.2dev)
- Added history on long click over back and forward buttons. ([#1622](https://github.com/brave/browser-laptop/issues/1622))
- Added search panel to preferences with more search options. ([#2694](https://github.com/brave/browser-laptop/issues/2694))
- Added search shortcuts (Example: "yt cat videos" in the URL bar to search for cat videos on YouTube). ([#2694](https://github.com/brave/browser-laptop/issues/2694))
- Added a search box to the Bookmarks page (about:bookmarks) ([#995](https://github.com/brave/browser-laptop/issues/995))
- Added context menu for cloning a tab including back-forward history. ([#2593](https://github.com/brave/browser-laptop/pull/2593))
- Added support for forking navigation via `CmdOrCtrl+Click` on back, forward or reload buttons. ([#2753](https://github.com/brave/browser-laptop/issues/2753))
- Added optional Shift for zoom in shortcut. ([#2685](https://github.com/brave/browser-laptop/issues/2685))
- Added Run `<noscript>` tag when noscript is active. ([#2671](https://github.com/brave/browser-laptop/issues/2671))
- Added smoother animations. ([#2765](https://github.com/brave/browser-laptop/issues/2765))
- Added Bravery top level menu. ([#2669](https://github.com/brave/browser-laptop/issues/2669))
- Added restart dialog for prefs that require restart. ([#2543](https://github.com/brave/browser-laptop/issues/2543))
- Added search image on context menu if default engine is google. ([#2606](https://github.com/brave/browser-laptop/issues/2606))
- Added a way to view SSL certificates when there is an error. ([#1057](https://github.com/brave/browser-laptop/issues/1057))
- Security (Severity: High): Address Bar Spoofing security. ([#2723](https://github.com/brave/browser-laptop/issues/2723))
- Security (Severity: High): Re-enable mixed content blocking. ([#2887](https://github.com/brave/browser-laptop/issues/2887))
- Optimized React rendering and IPC when typing in the URL bar. ([#2736](https://github.com/brave/browser-laptop/issues/2736))
- Changed tab-specific notifications to only be shown on the active tab. ([#1928](https://github.com/brave/browser-laptop/issues/1928))
- Changed bookmarks bar to auto opens on first bookmark if no bookmarks exist. ([#1487](https://github.com/brave/browser-laptop/issues/1487))
- Fixed auto logging out when clear cookies on shutdown option is on. ([#2620](https://github.com/brave/browser-laptop/issues/2620))
- Fixed basic auth not working on some pages. ([#1997](https://github.com/brave/browser-laptop/issues/1997))
- Fixed playing videos on drive.google.com. ([#2533](https://github.com/brave/browser-laptop/issues/2533))
- Fixed viewing s.codepen.io. ([#2665](https://github.com/brave/browser-laptop/issues/2665))
- Fixed running 2 instances of PDF.js at once. ([#2619](https://github.com/brave/browser-laptop/issues/2619))
- Fixed exiting fullscreen view when tab is closed. ([#2618](https://github.com/brave/browser-laptop/issues/2618))
- Fixed not hiding find bar for inter-page navigation. ([#323](https://github.com/brave/browser-laptop/issues/323))
- Fixed delete button handling in URL bar. ([#2647](https://github.com/brave/browser-laptop/issues/2647))
- Fixed some PDF files not showing. ([#2654](https://github.com/brave/browser-laptop/issues/2654))
- Fixed Notification bar for crashes not dismissing. ([#2617](https://github.com/brave/browser-laptop/issues/2617))
- Fixed "Open Image In New Tab" respecting private / session info. ([#2746](https://github.com/brave/browser-laptop/issues/2746))
- Fixed pressing down on URL bar now shows autosuggest. ([#2444](https://github.com/brave/browser-laptop/issues/2444))
- Fixed showing scrollbars in tabs bar in Arch linux. ([#2599](https://github.com/brave/browser-laptop/issues/2599))
- Upgraded to libchromiumcontent 52.0.2743.82. ([#1592](https://github.com/brave/browser-laptop/issues/1592))
- Upgraded to Electron 1.3.0. ([#2635](https://github.com/brave/browser-laptop/issues/2635))

## [0.11.1](https://github.com/brave/browser-laptop/releases/v0.11.1dev)
- Added built-in PDF reader with PDF.js. Can be disabled in preferences. ([#1084](https://github.com/brave/browser-laptop/issues/1084))
- Added more data clearing options, including on shutdown. ([#2472](https://github.com/brave/browser-laptop/issues/2472))
- Added support for navigator.registerProtocolHandler (Mostly used for gmail `mailto:` and `bitcoin:` handling). ([#1583](https://github.com/brave/browser-laptop/issues/1583))
- Added Copy Image to clipboard option through the context menu. ([#1174](https://github.com/brave/browser-laptop/issues/1174))
- Added a customized Windows 10 Start Menu tile. ([#2372](https://github.com/brave/browser-laptop/issues/2372))
- Added edit bookmark ability when staring a site. ([#2439](https://github.com/brave/browser-laptop/issues/2439))
- Added Lastpass preferences. ([#2411](https://github.com/brave/browser-laptop/pull/2411))
- Added `Command + Shift + Click` support for various UI elements to open and focus a new tab. ([#2436](https://github.com/brave/browser-laptop/issues/2436))
- Fixed Vimeo player not playing due to referrer blocking. ([#2474](https://github.com/brave/browser-laptop/issues/2474))
- Fixed crashes with notifications. ([#1931](https://github.com/brave/browser-laptop/issues/1931))
- Fixed new-tab ordering from pinned tabs. ([#2453](https://github.com/brave/browser-laptop/issues/2453))
- Fixed exiting full screen when closing a full screen tab. ([#2404](https://github.com/brave/browser-laptop/issues/2404))
- Fixed spell check happening in URLbar. ([#2434](https://github.com/brave/browser-laptop/issues/2434))
- Fixed webRTC fingerprinting blocking. ([#2412](https://github.com/brave/browser-laptop/issues/2412))
- Fixed find in page highlighting not clearing when find bar is closed. ([#2476](https://github.com/brave/browser-laptop/issues/2476))
- Fixed two finger swipe gesture on macOS conflicting with scrolling. ([#2577](https://github.com/brave/browser-laptop/issues/2577))
- Upgraded to Electron 1.2.7. ([#2470](https://github.com/brave/browser-laptop/issues/2470))

## [0.11.0](https://github.com/brave/browser-laptop/releases/v0.11.0dev)
- Added LastPass support. ([#2316](https://github.com/brave/browser-laptop/issues/2316))
- Added WebRTC fingerprinting protection. ([#260](https://github.com/brave/browser-laptop/issues/260))
- Added Flash Click to Play support (Flash is only available after enabling Flash in preferences explicitly). ([#2279](https://github.com/brave/browser-laptop/issues/2279))
- Added lookup selection to context menu for macOS. ([#1627](https://github.com/brave/browser-laptop/issues/1627))
- Changed pin tab option to not show for `about:blank` and `about:newtab`. ([#2253](https://github.com/brave/browser-laptop/issues/2253))
- Changed user agent for Adobe Flash website Brave detection. ([811e742](https://github.com/brave/browser-laptop/commit/811e742b4bdb393cc9dc092d9d61af2bb879a047))
- Fixed 1password auto-start. ([#2298](https://github.com/brave/browser-laptop/issues/2298))
- Fixed 1password auto-fill regression. ([#2308](https://github.com/brave/browser-laptop/issues/2308))
- Fixed session tabs 1password bug. ([#2303](https://github.com/brave/browser-laptop/issues/2303))
- Fixed downloads bar overflow. ([#2322](https://github.com/brave/browser-laptop/issues/2322))
- Fixed selection menu to truncate properly. ([#2240](https://github.com/brave/browser-laptop/issues/2240))
- Fixed cookie changes not persisting to disk on fast shutdown. ([#2335](https://github.com/brave/browser-laptop/issues/2335))

## [0.10.4](https://github.com/brave/browser-laptop/releases/v0.10.4dev)
- Added autocomplete support in the URL bar. ([#1596](https://github.com/brave/browser-laptop/issues/1596))
- Added blocking for 3rd party client storage mechanisms. ([#313](https://github.com/brave/browser-laptop/issues/313))
- Added blocking for 3rd party referrers. ([#2214](https://github.com/brave/browser-laptop/issues/2214))
- Added default content zoom option. ([#1401](https://github.com/brave/browser-laptop/issues/1401))
- Added option for disabling title mode (defaulted to on for Windows until we remove the title bar). ([#1984](https://github.com/brave/browser-laptop/issues/1984))
- Added experimental Flash support (disabled by default). ([#1093](https://github.com/brave/browser-laptop/issues/1093))
- Improved URL bar suggestions and now include URL of suggestion. ([#2210](https://github.com/brave/browser-laptop/issues/2210))
- Improved Bookmarks Manager folders so they stick when scrolling. ([#2076](https://github.com/brave/browser-laptop/issues/2076))
- Improved session storage saving to write in a more safe way. ([#2067](https://github.com/brave/browser-laptop/issues/2067))
- Improved zoom handling. ([#2165](https://github.com/brave/browser-laptop/issues/2165))
- Fixed Twitch.tv playing streams twice. ([#2119](https://github.com/brave/browser-laptop/issues/2119))
- Fixed crash when navigating with the notification bar open. ([#1726](https://github.com/brave/browser-laptop/issues/1726))
- Fixed tab page ordering with pinned tabs. ([#149](https://github.com/brave/browser-laptop/issues/149))
- Fixed window state not saving in session storage. ([#146](https://github.com/brave/browser-laptop/issues/146))
- Fixed navigator.doNotTrack not reporting correctly. ([#2177](https://github.com/brave/browser-laptop/issues/2177))
- Fixed window titles not showing up in the Window menu in macOS. ([#2192](https://github.com/brave/browser-laptop/issues/2192))
- Fixed navigation controller sometimes making back button not function correctly. ([#2144](https://github.com/brave/browser-laptop/issues/2144))
- Fixed Fullscreen mode on Windows so it hides menu bar. ([#2053](https://github.com/brave/browser-laptop/issues/2053))
- Upgraded to libchromiumcontent 51.0.2704.103. ([#2211](https://github.com/brave/browser-laptop/issues/2211))
- Upgraded to Electron 1.2.3. ([#2294](https://github.com/brave/browser-laptop/issues/2294))

## [0.10.3](https://github.com/brave/browser-laptop/releases/v0.10.3dev)
- Upgraded to libchromiumcontent 51.0.2704.84. ([#2122](https://github.com/brave/browser-laptop/issues/2122))

## [0.10.2](https://github.com/brave/browser-laptop/releases/v0.10.2dev)
- Fixed crash on Windows when clicking on certain link types. ([#2064](https://github.com/brave/browser-laptop/issues/2064))

## [0.10.1](https://github.com/brave/browser-laptop/releases/v0.10.1dev)
- Included fingerprinting protection into the Bravery Panel. ([#1876](https://github.com/brave/browser-laptop/issues/1876))
- Added protection for AudioContext fingerprinting. ([#1884](https://github.com/brave/browser-laptop/issues/1884))
- Added number of scripts blocked to the Bravery panel. ([#1833](https://github.com/brave/browser-laptop/issues/1833))
- Added support for bookmarklets. ([#1880](https://github.com/brave/browser-laptop/issues/1880))
- Added show only favicon option to the bookmarks toolbar. ([#1657](https://github.com/brave/browser-laptop/issues/1657))
- Added bookmark tooltips. ([#1848](https://github.com/brave/browser-laptop/issues/1848))
- Added folder icons when using bookmark toolbar favicons. ([#1469](https://github.com/brave/browser-laptop/issues/1469))
- Added application icon in Ubuntu. ([#1282](https://github.com/brave/browser-laptop/issues/1282))
- Expose chrome.runtime for better site compat mainly for Google drive. ([#1948](https://github.com/brave/browser-laptop/pull/1948))
- Fixed processes sometimes not quitting. ([#1756](https://github.com/brave/browser-laptop/issues/1756))
- Fixed Windows taskbar grouping. ([#156](https://github.com/brave/browser-laptop/issues/156))
- Fixed whitescreen which could happen when dragging and dropping. ([#1891](https://github.com/brave/browser-laptop/issues/1891))
- Fixed bookmark items middle click to open in a new tab on Windows 10. ([#1724](https://github.com/brave/browser-laptop/issues/1724))
- Fixed redownloading files on session restore ([#1219](https://github.com/brave/browser-laptop/issues/1219))
- Fixed pinned tabs sometimes duplicating. ([#1508](https://github.com/brave/browser-laptop/issues/1508))
- Fixed Fullscreen mode showing a black bar up top on macOS. ([#1358](https://github.com/brave/browser-laptop/issues/1358))
- Fixed contractions showing up as misspelled for spell check. ([#2015](https://github.com/brave/browser-laptop/issues/2015))
- Fixed non-English spell checking dictionaries. ([#1788](https://github.com/brave/browser-laptop/issues/1788))
- Possibly fixed intermittent problem with copy on macOS. ([#1060](https://github.com/brave/browser-laptop/issues/1060))
- Upgraded to HTTPS Everywhere definitions for 5.1.9. ([#1692](https://github.com/brave/browser-laptop/issues/1692))
- Upgraded to libchromiumcontent 51.0.2704.63. ([#1405](https://github.com/brave/browser-laptop/issues/1405))
- Upgraded to Electron 1.2.0. ([#1968](https://github.com/brave/browser-laptop/issues/1968))
- Upgraded to Node 6.1. ([#1969](https://github.com/brave/browser-laptop/issues/1969))
- [Various other fixes.](https://github.com/brave/browser-laptop/milestones/0.10.1dev)

## [0.10.0](https://github.com/brave/browser-laptop/releases/v0.10.0dev)
- Per site Bravery panel and per site settings. ([#1621](https://github.com/brave/browser-laptop/issues/1621))
- Bravery setting defaults now in preferences. ([#1818](https://github.com/brave/browser-laptop/issues/1818))
- Implemented error pages. ([#1611](https://github.com/brave/browser-laptop/issues/1611))
- Lazy load tabs on startup. ([#470](https://github.com/brave/browser-laptop/issues/470))
- Added search for selected text context menu. ([#1672](https://github.com/brave/browser-laptop/pull/1672))
- Fixed various crashes. ([#1611](https://github.com/brave/browser-laptop/issues/1611), [#1772](https://github.com/brave/browser-laptop/issues/1772))
- Fixed zoom not working in some cases. ([#1717](https://github.com/brave/browser-laptop/issues/1717))
- Re-added close tabs left / right context menu on tabs. ([#1783](https://github.com/brave/browser-laptop/issues/1783))
- Updated localization files and added Spanish and Tamil. ([#1828](https://github.com/brave/browser-laptop/pull/1828))
- [Various other fixes.](https://github.com/brave/browser-laptop/issues?q=milestone%3A0.10.0dev+is%3Aclosed)

## [0.9.6](https://github.com/brave/browser-laptop/releases/v0.9.6dev)
- Upgraded to libchromiumcontent 50.0.2661.102. ([#1708](https://github.com/brave/browser-laptop/issues/1708))
- Fix application sometimes not quitting fully. ([#1540](https://github.com/brave/browser-laptop/issues/1540))
- Fix for URL bar context menu selection detection. ([#1709](https://github.com/brave/browser-laptop/issues/1709))
- Fix for disabling extensions without a browser restart. ([#1707](https://github.com/brave/browser-laptop/issues/1707))
- Fix zoom indicator in hamburger menu in private tabs. ([#1706](https://github.com/brave/browser-laptop/issues/1706))
- Menu bar is now auto hidden by default unless turned on. ([#1730](https://github.com/brave/browser-laptop/issues/1730))

## [0.9.5](https://github.com/brave/browser-laptop/releases/v0.9.5dev)
- Added spell check. ([#859](https://github.com/brave/browser-laptop/issues/859))
- Added NoScript like script blocking. ([#231](https://github.com/brave/browser-laptop/issues/231))
- Added support for many more languages. ([#1625](https://github.com/brave/browser-laptop/pull/1625))
- Various windows installer fixes. ([#523](https://github.com/brave/browser-laptop/pull/523), [#1244](https://github.com/brave/browser-laptop/pull/1244), [#1400](https://github.com/brave/browser-laptop/pull/1400), [#565](https://github.com/brave/browser-laptop/pull/565))
- Added Paste and Go and Paste and Search items in the URL bar context menu. ([#1670](https://github.com/brave/browser-laptop/pull/1670))
- Added ability to autohide menu bar on Windows. ([#1630](https://github.com/brave/browser-laptop/pull/1630))
- Fix for nfl.com videos when blocking was enabled. ([#1528](https://github.com/brave/browser-laptop/issues/1528))
- Fix bookmarks not filling up the complete bookmarks toolbar. ([#1567](https://github.com/brave/browser-laptop/issues/1567))
- Fix crash when navigating while dev tools are open. ([#1588](https://github.com/brave/browser-laptop/issues/1588))
- Fix for "tabnapping" phishing attempt. ([#1618](https://github.com/brave/browser-laptop/issues/1618))
- Fix unneeded indent in Windows for navigation controls. ([#1638](https://github.com/brave/browser-laptop/pull/1638))
- Fix for using numpad '+' for zoom. ([#1495](https://github.com/brave/browser-laptop/issues/1495))
- Fix for changing tabs per page giving an uneven distribution of tabs. ([#1561](https://github.com/brave/browser-laptop/issues/1561))
- Fix for opening and copying image context menus sometimes not giving the full URL. ([#1606](https://github.com/brave/browser-laptop/issues/1606))

## [0.9.4](https://github.com/brave/browser-laptop/releases/v0.9.4dev)
- Fixed startup problem if user data directory does not already exist.

## [0.9.3](https://github.com/brave/browser-laptop/releases/v0.9.3dev)
- Dashlane support bundled.
- Added permission handler for external protocols.
- Permission prompts now save decisions between restarts.
- Bookmark Toolbar favicons (can be turned on in about:preferences).
- Downloads remember last save location.
- More zoom fixes for page navigation.
- More password autofill fixes.
- More locales added.
- Added optional Home button.
- Fixed various bugs.
- Upgraded to libchromiumcontent 50.0.2661.94.
- Upgraded to Electron 0.37.7.

## [0.9.2](https://github.com/brave/browser-laptop/releases/v0.9.2dev)
- Added the ability to set Brave as the default browser within Control Panel on Windows.
- Added 32-bit Windows support.
- Added ability to block HTML canvas and WebGL fingerprinting which can be enabled in preferences.
- Zoom is now persisted across sessions and remembered per origin.
- Added menu item to clear all cookies and site data.
- Multi language support.  Initially this includes: en-US, nl-NL, and pt-Br.
- Ability to open html files when Brave is the default on macOS.
- Block 'javascript:' URLs from being loaded when entered in URL bar.
- Printing fixed.
- Fixed various bugs.
- Upgraded to libchromiumcontent 49.0.2623.112.
- Upgraded to Electron 0.37.6.

## [0.9.1](https://github.com/brave/browser-laptop/releases/v0.9.1dev)
- Undo closed tab now focuses the webview.
- Upgraded to React v15 for cleaner DOM and faster performance.
- Fix for about: pages font size.
- Fix for clicking on some JavaScript links not working.
- Fix startup error relating to session storage and passwords saved from forms without actions.
- Fix docusign.com login button not working.
- Fix for Twitch.tv.
- Fix for startup problem with default window size.

## [0.9.0](https://github.com/brave/browser-laptop/releases/v0.9.0dev)
- 1Password support bundled.
- Added malware and phishing protection with click through pages.
- Some downloads bar and password saving fixes.
- Windows installer now using SHA-256 digest and gets signed with a timestamp.
- New look for the SSL cert warning pages.
- Removed Brave from the User Agent HTTP header to reduce fingerprinting.
- Windows shortcuts added F12 for developer tools and F11 for fullscreen.
- Partial extensions support added internally for running some Chrome extensions unmodified.
- Upgraded to Node 5.10.0.

## [0.8.3](https://github.com/brave/browser-laptop/releases/v0.8.3dev)
- Add ability to enable/disable password manager in Preferences
- Added downloads toolbar which shows when there are active downloads.
- Added downloads manager (about:downloads).
- Added passwords manager (about:passwords).
- Inspect Element context menu option added to bring up the DOM inspector.
- Mouse wheel zooming with modifier key.
- Close other tabs context menu items added.
- Password saving fixes.
- Bookmark fixes.
- Upgraded to libchromiumcontent 49.0.2623.108.
- Upgraded to Electron 0.37.3.
- Upgraded to Node 5.9.1.
- Fixed various bugs.
- .deb and .rpm [Linux packages available](https://github.com/brave/browser-laptop/blob/master/docs/linuxInstall.md) for various distros.

## [0.8.2](https://github.com/brave/browser-laptop/releases/v0.8.2dev)
- Password saving feature added.
- Brave is now a single instance application.
- HTTPS Everywhere information is now displayed in the site information popup.
- Find in page now shows match ordinal.
- Open all bookmarks in bookmark folder context menu added.
- Improved bookmark import support (Safari, Pinboard).
- Fixes for fullscreen mode.
- Fixes for pinned sites not unpinning.
- Upgraded to libchromiumcontent 49.0.2623.87.
- Upgraded to Node v5.9.
- Various other bug fixes.

## [0.8.1](https://github.com/brave/browser-laptop/releases/v0.8.1dev)
- Upgraded to libchromiumcontent 49.0.2623.75.
- Upgraded to Electron 0.37.2.
- Upgraded to Node 5.8.
- Basic HTTP authentication now supported.
- Support for Twitch.tv
- Fix bookmarks not working after navigating within a page using push state api.
- Save session state periodically to prevent data loss.
- Window titles actually being set for better compatibility with other apps.
- We now show a broken lock icon for pages with certificate errors.
- Tweaked various UI bits.
- Fixed text cursor jumping to the end of a text input in the settings pane.
- Added import bookmarks item to the hamburger menu.
- Middle clicking on a bookmark folder now opens all bookmarks.
- Control tab, command tab, and middle click now works for bookmarks within a menu on the toolbar.
- Typekit and Google fonts fix.
- Dragging favicon onto bookmarks bar now respects position of the drop.
- We now `display: none` on background webviews for better performance.

## [0.8.0](https://github.com/brave/browser-laptop/releases/v0.8.0dev)
- Bookmark management: Bookmark folders added, drag and drop bookmarks and folders from within the Bookmark Toolbar and Bookmark Manager.
- Ability to import bookmarks from a Firefox or Chrome HTML export.
- History is now remembered for better autocomplete results.
- Permission dialogs added for sites wanting to request special permissions.
- Various shortcuts added for each platform.
- Support added for mouse back/forward web buttons.
- Window is now maximized when navigation bar is double clicked.
- Mouse middle clicking on bookmarks now opens the link in a new tab.
- Adblock and tracking protection fixed for non default sessions.
- Various cert warning page fixes.
- Don’t show context menu if a page has its own (Google docs).
- Added Home menu item and shortcut to go to home page.
- Added Clear history menu item.
- Help menu added to the hamburger menu.
- Various top level menu items now work when there are no windows open.
- Links opened from the context menu item “Open in new tab”  now retains private / session it was opened from.
- Extra protection against badly downloaded adblock, tracking protection, and https everywhere data files.
- Image blocking now replaces images with a 1px transparent local data url instead of blocking the request for better site compat (macworld.com).
- about: pages now have an icon so they can look better when pinned.
- Multiple update channel support added for future builds (beta, release channel support).
- Various other improvements and fixes.

## [0.7.16](https://github.com/brave/browser-laptop/releases/v0.7.16dev)
- Spotty text selection in URL bar fix.
- Added restore last closed window.
- Fix session store to restore state from last closed window.
- Pinned tabs and bookmarks are now session aware (Cmd+Click or Control+Click on Windows to open a bookmark in the original session).
- Fix video playing on CNBC, fix cityam.com adblocker error.
- Faster page loading from optimizations in HTTPS Everywhere.
- HTML drag and drop no longer opens extra tab.
- Dropping files on bookmarks bar to create bookmarks, and on toolbar to open in new tabs.
- Certificate error page improvements.
- Support dropping tabs onto tab set indicators to reorder them.
- Support pinning and unpinning sites via drag and drop.
- Fixed bug in auto suggest when hitting enter.
- Various Linux fixes.
- Fix 3rd party Facebook login.
- SQLite dependency for HTTPS Everywhere removed.

## [0.7.15](https://github.com/brave/browser-laptop/releases/v0.7.15dev)
- Added bookmarks toolbar.
- Added bookmarks manager (Very basic but more features coming soon).
- File picker crash fix.
- Optimizations when opening a new tab.
- Add certificate error pages and improve site security indicators.
- Various context menu, shortcut, and drag and drop improvements.
- Various bug fixes and improvements.

## [0.7.14](https://github.com/brave/browser-laptop/releases/v0.7.14dev)
- Security (Severity: High): Added process sandboxing for content processes ([c794907](https://github.com/brave/electron/commit/c794907d043ca5c498d1f07f5fdf6e866606ebaf)).
- Various UI rendering performance optimization.
- Fix loading videos on CNN and other page loading problems.
- Security (Severity: Low): Hostname is always displayed in title mode in bold.
- Security (Severity: High): Preferences page script context is now reloaded when navigating in the same tab away from preferences ([446dfe8](https://github.com/brave/browser-laptop/commit/446dfe8c1c39203e5f41f9bb6341a2103df1248c)).
- Theme color detection changes.
- Various bug fixes.

## [0.7.13](https://github.com/brave/browser-laptop/releases/v0.7.13dev)
- Preferences: startup mode, homepage, default search engine, various tab preferences, and privacy settings.  More to come.
- Various UI enhancements.
- Security: Third party cookie blocking option (enabled by default).
- Security: Third party HTTP Referer header blocking option (enabled by default).
- Security: Precautionary only, removed node from ever loading in web views.
- Security: Precautionary Added CSP to UI pages.
- Security: Secure sites now display a lock in title mode.
- Various keyboard shortcuts added, various focus issues fixed, various bugs fixed.
- Context menus copy link location works in more cases now.
- about:newtab, about:about pages implemented.
- Placeholder ads link to a page explaining what they are.
- 2 finger navigation on macOS.
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
