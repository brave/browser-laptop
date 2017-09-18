module.exports = function startReduxDevtoolsServer (flagName) {
  // default port to accept connections
  let port = 8181
  // allow port override from cli args
  const argIdx = process.argv.indexOf(flagName)
  if (argIdx !== -1) {
    const argValRaw = process.argv[argIdx + 1]
    if (argValRaw) {
      const argVal = Number(argValRaw)
      if (!Number.isNaN(argVal)) {
        port = argVal
      }
    }
  }
  // start listening
  require('remotedev-server')({
    hostname: 'localhost',
    port
  })
}
