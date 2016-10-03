const fakeElectron = {
  ipcMain: {
    on: function () { }
  },
  remote: {
    app: {
      on: function () {
      }
    }
  },
  app: {
    on: function () {
    }
  }
}
module.exports = fakeElectron
