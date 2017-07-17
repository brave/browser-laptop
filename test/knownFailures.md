# Known intermittent failures

This file is parsed when running automated tests on our CI.

Known failures are shown in logs, but status will be green unless it is an uknown failure.
These browser level tests are prone to intermittent failures and without ignoring known failures,
it makes it very hard to know what is safe and what is not safe to merge from PRs.

Parsing of this file simply looks for lines that start with "- " which indicates a known test failure.

## lint

There are no acceptable lint failures.

## unit

There are no acceptable unit test failures.

## about

- Advanced payment panel tests can backup wallet to file
- Advanced payment panel tests can recover wallet from file
- Advanced payment panel tests shows an error popover if a recovery key is not a UUID
- Advanced payment panel tests shows an error popover if both recovery keys are missing
- Advanced payment panel tests shows an error popover if one recovery key is missing
- Advanced payment panel tests shows an error popover if the file is empty
- Ledger table 2 publishers toggle non-verified option
- Regular payment panel tests can setup payments "before each" hook for "shows welcome page"

## app

## bookmark-components

 - Bravery Panel Adblock stats without iframe tests block device enumeration

## bravery-components

## contents

## misc-components

## navbar-components

- navigationBar tests lockIcon Blocks running insecure content
- navigationBar tests lockIcon Limit effect of running insecure content in frame
- navigationBar tests lockIcon Limit effect of running insecure content in private frame
- navigationBar tests lockIcon Shows insecure URL icon
- navigationBar tests lockIcon Shows insecure URL icon in title mode
- navigationBar tests lockIcon Shows secure URL icon
- navigationBar tests lockIcon Shows secure URL icon in title mode
- navigationBar tests lockIcon Temporarily allow/deny running insecure content
- navigationBar tests lockIcon shows insecure icon on a site with a sha-1 cert
- navigationBar tests lockIcon shows insecure icon on an HTTP PDF
- navigationBar tests lockIcon shows partially-secure icon on a site with passive mixed content
- navigationBar tests lockIcon shows secure icon on an HTTPS PDF
- navigationBar tests navigation focus newtab with page has focus in webview
- navigationBar tests submit with auth url input value hides auth part of the url
- urlBar tests autocomplete "before each" hook for "clears the selection"
- urlBar tests keeps url text separate from suffix text changes only the selection'
- urlBar tests loading same URL as current page with changed input "before all" hook
- urlBar tests search engine icon clears clears last search engine when loading arbitrary page
- urlBar tests search engine icon clears clears last search engine when searching

## tab-components

- tab tests tab transfer can detach into new windows
- tab tests webview previews when tab is hovered does not show tab previews when setting is off

