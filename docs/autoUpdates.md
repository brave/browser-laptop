# Overview

Auto updating provides services allowing the browser to automatically check for updates and apply the changes as they become available.

# OSX

After manual installation all subsequent updates will occur automatically via the Squirrel.mac services provided by the Electron (Atom) framework.

The built dmg binary requires its components to be digitally signed before the update system will check for new updates and install new versions.

## Definitions

  USER        = currently logged in user
  CERTIFICATE = A file issued by a third party used to digitally sign a binary confirming its origin
  IDENTIFIER  = Organizational identifier from certificate (10 digit uppercase alpha numeric)

## Steps to digitally sign binary

  1. Create and download developer certificate from developer.apple.com

     The certificate will be in the form of a .cer file. The cerficate will need to be added to the keychain via the Keychain Access program. Add the certificate in the login section. Note: The Keychain Access program is included in OSX and will by default handle issued .cert files.

  2. Ensure that a private keys exists and is associated with the certificate installed in step 1. A sub section of the certificate will be shown and tagged as a private key. Generating the private key (.p12 file) is a multi-stop process that requires access to the developer.apple.com portal and access to your development machine. It is described in detail at [generating a p12 file](http://appfurnace.com/2015/01/how-do-i-make-a-p12-file/). If you already have access to the private, import it into Keychain Access ensuring it is associated with the Developer certificate.

  3. Build uncompressed application assets to be signed

     `npm run build-darwin`

  4. Sign binary

     in Frameworks directory (Brave-darwin-x64/Contents/Brave.app/Contents/Frameworks)

       `codesign --deep --force --strict --verbose --sign IDENTIFIER *`

     in Brave-darwin-x64

       `codesign --deep --force --strict --verbose --sign IDENTIFIER Brave.app/`

     Alternative: The preceeding steps will be executed via an included shell script with the following. Note: The identifier must be set as an environment variable.

       `IDENTIFIER=12345ABCDE npm run build-installer`

  4b. Check that the signing process succeeded (not all output lines included below)

      Note: It is important that the Sealed Resources version is set to 2

      codesign -dvv Brave.app/

        Executable=/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/MacOS/Electron
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

      codesign --deep-verify --verbose=4 Brave.app/

        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper.app
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper.app
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/ReactiveCocoa.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Squirrel.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Mantle.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper NP.app
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper EH.app
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Mantle.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper EH.app/Contents/MacOS/Brave Helper EH
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper EH.app/Contents/MacOS/Brave Helper EH
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Squirrel.framework/Versions/Current/.
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper EH.app
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper NP.app/Contents/MacOS/Brave Helper NP
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper NP.app/Contents/MacOS/Brave Helper NP
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Brave Helper NP.app
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/ReactiveCocoa.framework/Versions/Current/.
        --prepared:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Electron Framework.framework/Versions/Current/.
        --validated:/Users/USER/repos/browser-electron/Brave-darwin-x64/Brave.app/Contents/Frameworks/Electron Framework.framework/Versions/Current/.
        Brave.app/: valid on disk
        Brave.app/: satisfies its Designated Requirement

  5. Browser will check for updates via menu entry

# Windows x64

TODO

# Deploying Updates

See [brave/vault-updater](https://github.com/brave/vault-updater) for deployment.
