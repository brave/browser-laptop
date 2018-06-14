/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const execute = require('./lib/execute')

const TEST_DIR = process.env.TEST_DIR

let cmd = []

switch (TEST_DIR) {
  case 'lint':
    cmd.push('standard')
    break
  case 'codecov':
    cmd.push('bash tools/codecov.sh')
    break
  case 'tools':
    cmd.push('python tools/test')
    break
  case 'performance':
    // 2017-09-28 Use debug builds for tests which require muon to run with
    // --debug, currently broken in Linux on prod muon builds.
    if (process.platform === 'linux') {
      cmd.push('node tools/downloadMuonDebugBuild.js')
    }
    // Intentionally no break, because perf tests also run the below
  default: // eslint-disable-line
    cmd.push(`mocha "test/${TEST_DIR}/**/*Test.js" --globals chrome,DOMParser,XMLSerializer`)
}

execute(cmd, process.env, (err) => {
  if (err) {
    console.error('failed', err)
    process.exit(1)
  }
  console.log('done')
})
