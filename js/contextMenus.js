/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const remote = require('remote')
const Menu = remote.require('menu')
const Clipboard = require('clipboard')
const messages = require('./constants/messages')
const WindowActions = require('./actions/windowActions')
const AppActions = require('./actions/appActions')
const SiteTags = require('./constants/siteTags')

function tabPageTemplateInit (framePropsList) {
  const muteAll = (framePropsList, mute) => {
    framePropsList.forEach(frameProps => {
      if (mute && frameProps.get('audioPlaybackActive') && !frameProps.get('audioMuted')) {
        WindowActions.setAudioMuted(frameProps, true)
      } else if (!mute && frameProps.get('audioMuted')) {
        WindowActions.setAudioMuted(frameProps, false)
      }
    })
  }
  return [{
    label: 'Unmute tabs',
    click: (item, focusedWindow) => {
      muteAll(framePropsList, false)
    }
  }, {
    label: 'Mute tabs',
    click: (item, focusedWindow) => {
      muteAll(framePropsList, true)
    }
  }]
}

function inputTemplateInit (e) {
  const hasSelection = e.target.selectionStart !== undefined &&
      e.target.selectionEnd !== undefined &&
      e.target.selectionStart !== e.target.selectionEnd
  return getEditableItems(hasSelection)
}

function tabTemplateInit (frameProps) {
  const tabKey = frameProps.get('key')
  const items = []
  items.push({
    label: 'Reload tab',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_FRAME_RELOAD, tabKey)
      }
    }
  })

  if (frameProps.get('isPinned')) {
    items.push({
      label: 'Unpin tab',
      click: (item) => {
        // Handle converting the current tab window into a pinned site
        WindowActions.setPinned(frameProps, false)
        // Handle setting it in app storage for the other windows
        AppActions.removeSite(frameProps, SiteTags.PINNED)
      }
    })
  } else {
    items.push({
      label: 'Pin tab',
      click: (item) => {
        // Handle converting the current tab window into a pinned site
        WindowActions.setPinned(frameProps, true)
        // Handle setting it in app storage for the other windows
        AppActions.addSite(frameProps, SiteTags.PINNED)
      }
    })
  }

  if (frameProps.get('audioPlaybackActive')) {
    if (frameProps.get('audioMuted')) {
      items.push({
        label: 'Unmute tab',
        click: item => {
          WindowActions.setAudioMuted(frameProps, false)
        }
      })
    } else {
      items.push({
        label: 'Mute tab',
        click: item => {
          WindowActions.setAudioMuted(frameProps, true)
        }
      })
    }
  }

  Array.prototype.push.apply(items, [{
    label: 'Disable tracking protection',
    enabled: false
  }, {
    label: 'Disable ad block',
    enabled: false
  }])

  if (!frameProps.get('isPinned')) {
    items.push({
      label: 'Close tab',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          // TODO: Don't switch active tabs when this is called
          focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, tabKey)
        }
      }
    })
  }

  return items
}

function getEditableItems (hasSelection) {
  return [{
    label: 'Cut',
    enabled: hasSelection,
    accelerator: 'CmdOrCtrl+X',
    // Enabled doesn't work when a role is used
    role: hasSelection && 'cut' || undefined
  }, {
    label: 'Copy',
    enabled: hasSelection,
    accelerator: 'CmdOrCtrl+C',
    // Enabled doesn't work when a role is used
    role: hasSelection && 'copy' || undefined
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    type: 'separator'
  }]
}

function mainTemplateInit (nodeProps) {
  const template = [
    {
      label: 'Reload',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
        }
      }
    }, {
      label: 'View Page Source',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
        }
      }
    }, {
      label: 'Add bookmark',
      enabled: false
    }, {
      label: 'Add to reading list',
      enabled: false
    }
  ]
  const nodeName = nodeProps.name
  switch (nodeName) {
    case 'A':
      template.push({
        label: 'Open in new tab',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            // TODO: open this in the next tab instead of last tab
            // TODO: If the tab is private, this should probably be private.
            // Depends on #139
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src)
          }
        }
      })
      template.push({
        label: 'Open in new private tab',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            // TODO: open this in the next tab instead of last tab
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src, { isPrivate: true })
          }
        }
      })
      template.push({
        label: 'Open in new partitioned session',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            // TODO: open this in the next tab instead of last tab
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src, { isPartitioned: true })
          }
        }
      })
      template.push({
        label: 'Copy link address',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            Clipboard.writeText(nodeProps.src)
          }
        }
      })
      break
    case 'IMG':
      template.push({
        label: 'Save image...',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            focusedWindow.webContents.downloadURL(nodeProps.src)
          }
        }
      })
      template.push({
        label: 'Open image in new tab',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            // TODO: open this in the next tab instead of last tab
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src)
          }
        }
      })
      template.push({
        label: 'Copy image address',
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.src) {
            Clipboard.writeText(nodeProps.src)
          }
        }
      })
      break
  }

  if (nodeName === 'TEXTAREA' || nodeName === 'INPUT' || nodeProps.isContentEditable) {
    const editableItems = getEditableItems(nodeProps.hasSelection)
    editableItems.push({ type: 'separator' })
    template.unshift(...editableItems)
  }

  return template
}

export function onMainContextMenu (nodeProps) {
  const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps))
  mainMenu.popup(remote.getCurrentWindow())
}

export function onTabContextMenu (frameProps, e) {
  e.preventDefault()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(frameProps))
  tabMenu.popup(remote.getCurrentWindow())
}

export function onTabPageContextMenu (framePropsList, e) {
  e.preventDefault()
  const tabPageMenu = Menu.buildFromTemplate(tabPageTemplateInit(framePropsList))
  tabPageMenu.popup(remote.getCurrentWindow())
}

export function onURLBarContextMenu (e) {
  const inputMenu = Menu.buildFromTemplate(inputTemplateInit(e))
  inputMenu.popup(remote.getCurrentWindow())
}
