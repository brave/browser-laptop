/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../components/styles/global')

const welcomeBg = require('../../extensions/brave/img/preferences/ads_welcome_BG.png')

// TODO we need to move this into a separate component if this will be used in production as well
class AboutWelcome extends React.Component {
  render () {
    return <div>
      <div className={css(styles.et_pb_section)}>
        <div className={css(styles.et_pb_row, styles.et_pb_row_0)}>
          <h1 className={css(styles.h1)}>
            Thank you for participating in the Brave Ads Test Program
          </h1>
        </div>
        <div className={css(styles.et_pb_row)}>
          <div className={css(styles.et_pb_column, styles.et_pb_column_1_3)}>
            <a
              className={css(styles.et_pb_button)}
              href='chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-preferences.html#ads'
              target='_blank'
            >
              Let's Get Started!
            </a>
          </div>
          <div className={css(styles.et_pb_column, styles.et_pb_column_2_3)}>
            <p className={css(styles.p3, styles.note)}>
              <b className={css(styles.p3_b)}>Note</b>: This version of Brave should only be used by those who have been invited to participate
              in the Brave Ads Trial program. If you have found your way here by accident, please download the normal
              release version for your device at <a href='https://brave.com/download' target='_blank' className={css(styles.link)}>https://brave.com/download</a>
            </p>
            <p className={css(styles.p3)}>
              <b className={css(styles.p3_b)}>Brave Ads will give you your fair share of ad dollars.</b>&nbsp;
              For that to happen, <b className={css(styles.p3_b)}>we need volunteers who are willing to share their data</b> to
              help us build a private ad platform. This will enable the production version of Brave Ads to allow
              you to have more control of your data while being paid to view and interact with ads, in the form of
              BAT, the Basic Attention Token. <b className={css(styles.p3_b)}>This version of Brave is a test build for those volunteers only.</b>
            </p>
            <p className={css(styles.p3, styles.pr_no)}>
              <b className={css(styles.p3_b)}>How the test works:</b> A few times per day, a handful of relevant ads
              are presented to you. In exchange for your participation in downloading and using the test browser
              for 28 days. Try it now and let us know what you think of the new Brave Ads.
            </p>
            <div className={css(styles.et_pb_divider_internal)} />
            <p className={css(styles.p3)}>
              This version of Brave Ads is part of a test which sends your browsing activity and other potentially
              sensitive data to Brave. If you’re not part of this test program, do not use this version of Brave.
              The test will complete in 28 days, after which we recommend an upgrade to the Brave production version
              that will no longer collect any browsing history or activity. <b className={css(styles.p3_b)}>When Brave
              Ads launches later this year, all personal data and browsing history will remain on-device and will
              not be transmitted to Brave or anyone else. The data being collected in this test is specific
              to this test.</b>
            </p>
            <p className={css(styles.p3, styles.pr_no)}>
              <a href='https://brave.com/hc-privacy' target='_blank' className={css(styles.link)}>
                Learn more about this test.
              </a>
            </p>
          </div>
          <div className={css(styles.clear)} />
        </div>
      </div>
      <iframe data-test-id='welcomeIframe' className={css(styles.welcomeIframe)} src='https://brave.com/welcome' />
    </div>
  }
}

const styles = StyleSheet.create({
  welcomeIframe: {
    width: '100%',
    minHeight: '3350px',
    border: 0
  },

  et_pb_section: {
    position: 'relative',
    padding: '120px 0 54px',
    backgroundSize: 'initial',
    backgroundPosition: 'center right',
    backgroundRepeat: 'no-repeat',
    backgroundImage: `url(${welcomeBg}),linear-gradient(180deg,#5c32e5 10%,#6b2f8e 100%)`
  },

  et_pb_row: {
    padding: '26px 0',
    position: 'relative',
    width: '80%',
    maxWidth: '1080px',
    margin: 'auto',
    fontFamily: globalStyles.typography.display.family
  },

  et_pb_row_0: {
    paddingTop: '20px',
    paddingRight: '0px',
    paddingBottom: '27px',
    paddingLeft: '0px'
  },

  et_pb_column: {
    float: 'left',
    position: 'relative',
    zIndex: 9
  },

  h1: {
    fontSize: '40px',
    color: '#fff',
    lineHeight: '135%',
    fontWeight: '500',
    margin: '0 0 30px',
    padding: 0
  },

  h3: {
    fontSize: '24px',
    color: '#fff',
    fontWeight: '500',
    lineHeight: '40px',
    padding: '0 0 10px',
    margin: 0
  },

  et_pb_column_1_3: {
    marginRight: '5.5%',
    width: '29.666%'
  },

  et_pb_button: {
    color: '#ffffff!important',
    borderRadius: '93px',
    fontSize: '19px',
    fontWeight: '500 !important',
    backgroundColor: '#fb542b',
    display: 'inline-block',
    padding: '0.3em 50px !important',
    lineHeight: '1.7em!important',
    border: '2px solid #fff',
    textDecoration: 'none',
    animationTimingFunction: 'linear',
    animationDuration: '.2s',
    transition: 'all .2s'
  },

  et_pb_column_2_3: {
    width: '64.833%'
  },

  clear: {
    clear: 'both'
  },

  et_pb_divider_internal: {
    borderTop: '1px solid #fff',
    marginBottom: '4.242%',
    height: '23px',
    marginTop: '30px'
  },

  p3: {
    paddingBottom: '15px',
    color: '#fff',
    fontSize: '17px',
    fontWeight: 300,
    margin: 0
  },

  p3_b: {
    fontWeight: 500
  },

  pr_no: {
    paddingBottom: 0
  },

  link: {
    color: '#fff'
  },

  note: {
    backgroundColor: 'rgba(0,0,0,0.23)',
    padding: '15px 15px 35px',
    marginBottom: '20px'
  }
})

module.exports = <AboutWelcome />
