/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const remote = require('remote')
const Menu = remote.require('menu')

function tabTemplateInit (tabKey) {
  return [
    {
      label: 'Reload tab',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send('shortcut-frame-reload', tabKey)
        }
      }
    }, {
      label: 'Mute tab',
      click: (item, focusedWindow) => {
        console.log('got mute tab click')
      }
    }, {
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
          focusedWindow.webContents.send('shortcut-close-frame', tabKey)
        }
      }
    }
  ]
}

function mainTemplateInit (element) {
  return [
    {
      label: 'Reload',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send('shortcut-active-frame-reload')
        }
      }
    }, {
      label: 'View Page Source',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          console.log('got source', element)
        }
      }
    }
  ]
}

export function onMainContextMenu (e) {
  e.preventDefault()
  const mainMenu = Menu.buildFromTemplate(mainTemplateInit(e))
  mainMenu.popup(remote.getCurrentWindow())
}

export function onTabContextMenu (tabKey, e) {
  e.preventDefault()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(tabKey))
  tabMenu.popup(remote.getCurrentWindow())
}
