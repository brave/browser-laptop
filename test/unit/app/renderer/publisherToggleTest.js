/* global describe, it, before, after */
const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const tldjs = require('tldjs')
const fakeElectron = require('../../lib/fakeElectron')
const settingsConst = require('../../../../js/constants/settings')
let PublisherToggle
require('../../braveUnit')

describe('PublisherToggle component', function () {
  const getDomain = (url) => tldjs.getDomain(url)
  const getPattern = (pattern) => `https?://${getDomain(pattern)}`
  const getHostPattern = (pattern, isEnabled, shouldShow) => Immutable.fromJS({
    [pattern]: {
      'ledgerPayments': isEnabled,
      'ledgerPaymentsShown': shouldShow
    }
  })
  const getPublisherSynopsis = (url, verified) => Immutable.fromJS([{
    'site': getDomain(url),
    'publisherURL': url,
    'verified': verified
  }])

  const url1 = 'https://clifton.io/sharing-my-passion-for-mercedes-benz'
  const domain1 = getDomain(url1)
  const pattern1 = getPattern(domain1)

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')
    mockery.registerMock('../../../js/settings', { getSetting: (settingKey, settingsCollection, value) => {
      if (settingKey === settingsConst.PAYMENTS_ENABLED) {
        return true
      }
      return false
    }})
    mockery.registerMock('electron', fakeElectron)
    window.chrome = fakeElectron
    PublisherToggle = require('../../../../app/renderer/components/publisherToggle')
  })
  after(function () {
    mockery.disable()
  })

  describe('criteria to be shown', function () {
    it('render if domain match synopsis criteria (siteSettings is empty)', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={Immutable.Map()}
          synopsis={getPublisherSynopsis(domain1, false)} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
    })
    it('render if hostPattern match siteSettings (synopsis is empty)', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={getHostPattern(pattern1, true, true)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
    })
    it('do not render for unauthorized publishers (no siteSettings and no synopsis)', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={Immutable.Map()}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 0)
    })
    it('do not render if publisher is permanently hidden', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={getHostPattern(pattern1, true, false)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 0)
    })
    it('show as enabled if ledgerPayments is true for that publisher', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={getHostPattern(pattern1, true, true)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.props()['data-test-authorized'], true)
    })
    it('Show as disabled if ledgerPayments is false for that publisher', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={getHostPattern(pattern1, false, true)}
          synopsis={Immutable.List()} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-authorized'], false)
    })
    it('Show as verified if publisher is a verified publisher', function () {
      const wrapper = shallow(
        <PublisherToggle
          url={url1}
          hostSettings={Immutable.Map()}
          synopsis={getPublisherSynopsis(domain1, true)} />
      )
      assert.equal(wrapper.find('[data-test-id="publisherButton"]').length, 1)
      assert.equal(wrapper.props()['data-test-verified'], true)
    })
  })
})
