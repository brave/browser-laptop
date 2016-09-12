/* global describe, before, after, it */
const formatUtil = require('../../../app/common/lib/formatUtil')
const assert = require('assert')

require('../braveUnit')

describe('formatUtil', function () {
  describe('Windows and Linux', function () {
    before(function () {
      this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
    })

    after(function () {
      Object.defineProperty(process, 'platform', this.originalPlatform);
    })

    it('puts the modifiers in the correct order', function () {
      const result = formatUtil.formatAccelerator('A+Shift+Alt+CmdOrCtrl')
      assert.equal(result, 'Ctrl+Alt+Shift+A')
    })
    it('leaves modifiers alone if order is correct', function () {
      const result = formatUtil.formatAccelerator('Ctrl+Shift+O')
      assert.equal(result, 'Ctrl+Shift+O')
    })
  })

  describe('Mac', function () {
    before(function () {
      this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });
    })

    after(function () {
      Object.defineProperty(process, 'platform', this.originalPlatform);
    })

    it('replaces the key names with the correct symbols', function () {
      const result = formatUtil.formatAccelerator('Alt+CmdOrCtrl+Ctrl+Shift+O')
      assert.equal(result, '⌥⇧^⌘O')
    })
  })
})
