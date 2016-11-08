var baseHref = 'http://localhost:8080' // + process.env.npm_package_config_port
var appEntry = baseHref + '/gen/app.entry.js'

var baseNode = document.createElement('base')
baseNode.href = baseHref
document.getElementsByTagName('head')[0].appendChild(baseNode)

const createScript = function (scriptPath) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = scriptPath
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

document.querySelector('#webpackLoading').style.display = 'block'
createScript(appEntry).catch(function () {
  document.querySelector('#webpackLoading').style.display = 'none'
  document.querySelector('#setupError').style.display = 'block'
})
