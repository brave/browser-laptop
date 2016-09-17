/* global describe, before, after, it */
const formatUtil = require('../../../app/common/lib/formatUtil')
const assert = require('assert')

require('../braveUnit')

describe('formatUtil', function () {
  describe('formatAccelerator', function () {
    describe('when platform is Windows', function () {
      before(function () {
        this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
        Object.defineProperty(process, 'platform', {
          value: 'win32'
        })
      })

      after(function () {
        Object.defineProperty(process, 'platform', this.originalPlatform)
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

    describe('when platform is macOS', function () {
      before(function () {
        this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
        Object.defineProperty(process, 'platform', {
          value: 'darwin'
        })
      })

      after(function () {
        Object.defineProperty(process, 'platform', this.originalPlatform)
      })

      it('replaces the key names with the correct symbols', function () {
        const result = formatUtil.formatAccelerator('Alt+CmdOrCtrl+Ctrl+Shift+O')
        assert.equal(result, '⌥⇧^⌘O')
      })
    })
  })

  describe('wrappingClamp', function () {
    it('does not change value if within bounds', function () {
      assert.equal(formatUtil.wrappingClamp(5, 1, 10), 5)
    })
    it('wraps negatively', function () {
      assert.equal(formatUtil.wrappingClamp(-7, 1, 10), 3)
    })
    it('wraps positively', function () {
      assert.equal(formatUtil.wrappingClamp(18, 1, 10), 8)
    })
  })
})
