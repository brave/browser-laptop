# Overview of our build process for releases

[brave/browser-laptop](https://github.com/brave/browser-laptop) maintains its own version of [electron](https://github.com/brave/electron) and therefore also its own version of [electron-prebuilt](https://github.com/brave/electron-prebuilt).
Releases of `brave/electron` get added to the `gh-pages` branch of [brave/browser-electron-releases](https://github.com/brave/browser-laptop-releases/tree/gh-pages).
`brave/browser-laptop`'s dependency on `brave/electron-prebuilt` will download directly from `brave/browser-laptop-releases` github public page.

# Creating a new Brave Electron release

To create a new release of `brave/electron` for use in `brave/electron-prebuilt`:

- Clone electron with `git clone --recursive git@github.com:brave/electron`
- Rebase `brave/electron`'s commits to the upstream tag you'd like to create a release for.  e.g. `git rebase v0.37.2`
- Make sure the submodule dependencies in `vendor/` are up to date.
- For Linux and macOS builds, run `ELECTRON_RELEASE=1 ATOM_SHELL_GITHUB_TOKEN=<your-github-token> LIBCHROMIUMCONTENT_MIRROR=https://s3.amazonaws.com/brave-laptop-binaries/libchromiumcontent ./script/cibuild`.  Replace `<your-github-token>` with a token generated from https://github.com/settings/tokens
- For Windows builds, run `ELECTRON_RELEASE=1 ATOM_SHELL_GITHUB_TOKEN=<your-github-token> LIBCHROMIUMCONTENT_MIRROR=https://s3.amazonaws.com/brave-laptop-binaries/libchromiumcontent npm run cibuild-windows`.
- Manually download the release zip to a subfolder of `brave/browser-laptop-releases` and push it out.
- Mark the release draft as completed in the `brave/electron` repository releases page.
- Increase the version number of the package.json file so that `npm install` in `browser-laptop` will start using it.

# Create a new Brave browser release

First follow the steps in the previous section.

```
git clone git@github.com/brave/browser-laptop
rm -Rf ~/.electron
npm install
```

If you already have the repo checked out, it's recommended to `rm -Rf node_modules` instead of the clone.

Then do the following per OS:

**macOS:**

```
CHANNEL=dev npm run build-package
CHANNEL=dev IDENTIFIER=id-here npm run build-installer
```

**Windows:**

```
CHANNEL=dev npm run build-package
CHANNEL=dev CERT_PASSWORD=‘password-here’ npm run build-installer
````

Check virus scan: https://www.virustotal.com/en/

**Linux:**
```
./node_modules/.bin/webpack
CHANNEL=dev npm run build-package
CHANNEL=dev npm run build-installer
tar -jcvf Brave.tar.bz2 ./Brave-linux-x64
```

# Dependencies

[Brave's electron](https://github.com/brave/electron) fork maintains its own versions of [brightray](https://github.com/brave/brightray), [libchromiumcontent](https://github.com/brave/libchromiumcontent), and [node](https://github.com/brave/node).
The primary purpose of doing this is to be able to update dependencies for security releases faster than Electron does.


# Updating Chromium / Brightray

- Generate a new tarball from `brave/chromium-source-tarball` for the new version `./script/bootstrap` followed by `./script/sync 49.0.2623.75` followed by `GITHUB_TOKEN=key-here ./script/upload`.
- Rebase `brave/libchromiumcontent` from `atom/libchromiumcontent` upstream.
- Change `brave/libchromiumcontent/VERSION` to contain the chromium version tag to change to.  Example `49.0.2623.75`.   You can see the latest tags here: https://chromium.googlesource.com/chromium/src.git/+refs
- You can create patches as needed inside `brave/libchromiumcontent/patches`.  They will be automatically applied when doing builds.
- Some of the patches just mentioned will need rebasing on the new version.
- run `LIBCHROMIUMCONTENT_S3_BUCKET=brave-laptop-binaries LIBCHROMIUMCONTENT_S3_ACCESS_KEY=key-here AWS_ACCESS_KEY_SECRET=key-here AWS_ACCESS_KEY_SECRET=key-here LIBCHROMIUMCONTENT_S3_SECRET_KEY=key-here ./script/cibuild`.
- Brave's S3 bucket `brave-laptop-binaries` will be updated with the needed binaries.
- Update `brave/brightray`'s `/vendor/libchromiumcontent` submodule to point to the latest `brave/libchromiumcontent` changeset.
- From `brave/electron/script/lib/config.py` change `LIBCHROMIUMCONTENT_COMMIT` to point to the correct changeset from `brave/libchromiumcontent`.
- Update `brave/electron`'s `/vendor/brighray` submodule to point to the latest `brave/brightray` changeset.
- Update `brave/electron/atom/common/chrome_version.h` to include the latest version.  I think it is also set automatically on builds though.

# Updating Node

- Rebase `brave/node` from a tag or changeset in `https://github.com/nodejs/node`.
- Update `brave/electron/vendor/node` submodule to refer to the latest changeset in `brave/node`.
- Update each of the building machines to match the version of Node that you're upgrading to. This is needed because `postinstall` rebuilds native modules and it should match the exact Node version.
- You can tell which Node version we're on by looking at the first `brave/node` commit which is not from `electron/node`.  I.e. the first one from `nodejs/node`.
