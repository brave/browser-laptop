/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const remote = require('remote')
const Menu = remote.require('menu')
const messages = require('./constants/messages')
const WindowActions = require('./actions/windowActions')

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

  if (frameProps.get('audioPlaybackActive')) {
    if (frameProps.get('audioMuted')) {
      items.push({
        label: 'Unmute tab',
        click: (item, focusedWindow) => {
          WindowActions.setAudioMuted(frameProps, false)
        }
      })
    } else {
      items.push({
        label: 'Mute tab',
        click: (item, focusedWindow) => {
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
  }, {
    label: 'Close tab',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        // TODO: Don't switch active tabs when this is called
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, tabKey)
      }
    }
  }])

  return items
}

function mainTemplateInit (nodeName) {
  let template = [
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
  nodeName = nodeName.toUpperCase()
  switch (nodeName) {
    case 'A':
      template.push({
        label: 'Open in new tab'
      })
      break
    case 'IMG':
      template.push({
        label: 'Download image'
      })
      template.push({
        label: 'Open image in new tab'
      })
      break
  }
  return template
}

export function onMainContextMenu (nodeName) {
  const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeName))
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
