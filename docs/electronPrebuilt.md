# Overview of Electron Prebuilt and related repositories

[brave/browser-electron](https://github.com/brave/browser-electron) maintains its own version of [electron](https://github.com/brave/electron) and therefore also its own version of [electron-prebuilt](https://github.com/brave/electron-prebuilt).
Releases of `brave/electron` get added to the `gh-pages` branch of [brave/browser-electron-releases](https://github.com/brave/browser-electron-releases/tree/gh-pages).
`brave/browser-electron`'s dependency on `brave/electron-prebuilt` will download directly from `brave/browser-electron-releases` github public page.

# Creating a new release

To create a new release of `brave/electron` for use in `brave/electron-prebuilt`:

- Rebase `brave/electron`'s commits to the upstream tag you'd like to create a release for.
- For Linux and OSX builds, run `ELECTRON_RELEASE=1 ATOM_SHELL_GITHUB_TOKEN=<your-github-token> ATOM_SHELL_./script/cibuild`.  Replace `<your-github-token>` with a token generated from https://github.com/settings/tokens
- For Windows builds, run `ELECTRON_RELEASE=1 ATOM_SHELL_GITHUB_TOKEN=<your-github-token> npm run cibuild-windows`.
- Manually download the release zip to a subfolder of `brave/browser-electron-releases`.
- Mark the release draft as completed in the `brave/electron` repository.
