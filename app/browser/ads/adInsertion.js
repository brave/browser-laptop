const adDivCandidates = require('./adDivCandidates')
const appConfig = require('../../../js/constants/appConfig')
const messages = require('../../../js/constants/messages')
const electron = require('electron')
const ipcMain = electron.ipcMain

module.exports.init = () => {
  ipcMain.on(messages.GET_AD_DIV_CANDIDATES, (e, host) => {
    if (adDivCandidates[host]) {
      // only send the first 3 - this should really be the best 3, but we don't have enough data for that right now
      e.sender.send(messages.SET_AD_DIV_CANDIDATES, host, adDivCandidates[host].slice(0, 3), appConfig.adInsertion.url)
    }
  })
}
