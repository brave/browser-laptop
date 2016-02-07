const bravePort = process.env.BRAVE_PORT || 8080
const createScript = function (scriptPath) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = scriptPath.replace(/\{port\}/, bravePort)
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}
createScript('http://localhost:{port}/built/app.entry.js')
createScript('http://localhost:{port}/webpack-dev-server.js').catch(function () {
  document.querySelector('#setupError').style.display = 'block'
})
