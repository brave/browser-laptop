var exec = require('child_process').exec

module.exports = function (cmds, env, cb) {
  var cmd = ''
  if (!Array.isArray(cmds)) {
    cmds = [cmds]
  }
  cmd += cmds.join('&&')
  console.log(cmd)
  var r = exec(cmd, {
    env: env
  }, function () {
    if (cb) {
      cb()
    }
  })
  r.stdout.pipe(process.stdout)
  r.stderr.pipe(process.stderr)
}
