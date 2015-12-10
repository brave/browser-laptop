# Overview

Auto updating provides services allowing the browser to automatically check for updates and apply the changes as they become available.

# OSX

After manual installation all subsequent updates will occur automatically via the Squirrel.mac services provided by the Electron (Atom) framework.

The built dmg binary requires its components to be digitally signed before the update system will check for new updates and install new versions.

## Definitions

  USER       = currently logged in user
  IDENTIFIER = Organizational identifier from certificate (10 digit uppercase alpha numeric)
  APP        = APP name
  APP.app    = App filename

## Steps to digitally sign binary

  1. Create and download developer certificate from developer.apple.com

     The certificate will be in the form of a .cer file. The cerficate will need to be added to the keychain via the Keychain Access program. Add the certificate in the login section.

  2. Ensure that a private keys exists and is associated with the certificate installed in step 1. A sub section of the certificate will be shown and tagged as a private key.

  3. Build uncompressed application assets to be signed

     `npm run build-darwin`

  4. Sign binary

     in Frameworks directory (APP-darwin-x64/Contents/APP.app/Contents/Frameworks)

       `codesign --deep --force --strict --verbose --sign IDENTIFIER *`

     in APP-darwin-x64

       `codesign --deep --force --strict --verbose --sign IDENTIFIER APP.app/`

  4b. Check that the signing process succeeded (not all output lines included below)

      Note: It is important that the Sealed Resources version is set to 2

      codesign -dvv APP.app/

        Executable=/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/MacOS/Electron
        Identifier=com.electron.XXXX
        Format=bundle with Mach-O thin (x86_64)
        CodeDirectory v=20200 size=202 flags=0x0(none) hashes=3+3 location=embedded
        Signature size=4385
        Authority=3rd Party Mac Developer Application: XXXX Software, Inc. (IDENTIFIER)
        Authority=Apple Worldwide Developer Relations Certification Authority
        Authority=Apple Root CA
        Signed Time=Dec 9, 2015, 5:29:13 PM
        Info.plist entries=21
        TeamIdentifier=IDENTIFIER
        Sealed Resources version=2 rules=12 files=58929
        Internal requirements count=1 size=208

      codesign --deep-verify --verbose=4 APP.app/

        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper.app
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper.app
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/ReactiveCocoa.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Squirrel.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Mantle.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper NP.app
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper EH.app
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Mantle.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper EH.app/Contents/MacOS/APP Helper EH
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper EH.app/Contents/MacOS/APP Helper EH
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Squirrel.framework/Versions/Current/.
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper EH.app
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper NP.app/Contents/MacOS/APP Helper NP
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper NP.app/Contents/MacOS/APP Helper NP
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/APP Helper NP.app
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/ReactiveCocoa.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Electron Framework.framework/Versions/Current/.
        --validated:/Users/USER/repos/browser-electron/APP-darwin-x64/APP.app/Contents/Frameworks/Electron Framework.framework/Versions/Current/.
        APP.app/: valid on disk
        APP.app/: satisfies its Designated Requirement

  5. Build dmg

     `npm run installer-darwin` 

  6. Install dmg by mounting dmg and moving browser to the Applications folder

  7. Browser will check for updates on startup

# Windows x64

