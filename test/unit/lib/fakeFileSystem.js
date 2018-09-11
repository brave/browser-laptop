const fakeFileSystem = {
  readFileSync: (path) => {
    return JSON.stringify({
      cleanedOnShutdown: false
    })
  },
  writeFile: (path, options, callback) => {
    console.log('calling mocked fs.writeFile')
    callback()
  },
  rename: (oldPath, newPath, callback) => {
    console.log('calling mocked fs.rename')
    callback()
  },
  copySync: (oldPath, newPath) => {
    console.log('calling mocked fs.copySync')
  },
  existsSync: (path) => {
    console.log('calling mocked fs.existsSync')
    return true
  },
  remove: (path, callback) => {
    console.log('calling mocked fs.remove')
    if (callback) callback()
  },
  readdirSync: (path, options) => {
    console.log('calling mocked fs.readdirSync')
    return []
  },
  statSync: () => {
    return {
      isDirectory: () => true
    }
  }
}

module.exports = fakeFileSystem
