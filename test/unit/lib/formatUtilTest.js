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

  describe('toLocaleString', function () {
    it('formats the date as a string', function () {
      const result = formatUtil.toLocaleString(1479159834005)
      assert.equal(typeof result, 'string')
      assert.equal(result.length > 0, true)
    })
    it('falls back to provided default value if epoch is falsey', function () {
      const result = formatUtil.toLocaleString(null, 'abc')
      assert.equal(result, 'abc')
    })
    it('falls back to empty string if no default provided and epoch is falsey', function () {
      const result = formatUtil.toLocaleString()
      assert.equal(result, '')
    })
    it('falls back to default value if invalid date is passed', function () {
      const result = formatUtil.toLocaleString(NaN, 'def')
      assert.equal(result, 'def')
    })
    it('falls back to default value if a non-number is passed', function () {
      const result = formatUtil.toLocaleString('this is not a number', 'ghi')
      assert.equal(result, 'ghi')
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
