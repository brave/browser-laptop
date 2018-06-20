/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../components/styles/global')

// TODO we need to move this into a separate component if this will be used in production as well
class AboutWelcome extends React.Component {
  render () {
    return <div>
      <div className={css(styles.et_pb_section)}>
        <div className={css(styles.et_pb_row, styles.et_pb_row_0)}>
          <h1 className={css(styles.h1)}>
            Thanks for participating in the<br /><b>Brave Ads Trial Program!</b>
          </h1>
        </div>
        <div className={css(styles.et_pb_row)}>
          <div className={css(styles.et_pb_column, styles.et_pb_column_1_3)}>
            <a
              className={css(styles.et_pb_button)}
              href='chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-preferences.html#ads'
              target='_blank'
            >
              Let's Begin!
            </a>
          </div>
          <div className={css(styles.et_pb_column, styles.et_pb_column_2_3)}>
            <h3 className={css(styles.h3)}>
              Brave Ads finally gives you what you always wanted. Your fair share. Rather than being a
              product of the internet, take control!
            </h3>
            <p className={css(styles.p3, styles.pr_no)}>
              A few relevant ads are presented to you, a few times per day. In exchange for your valuable attention,
              advertisers pass some of the profits to you. A large sum. 70% actually! Try it now and  let us know what
              you think of the new Brave Ads solution.
            </p>
            <div className={css(styles.et_pb_divider_internal)} />
            <p className={css(styles.p3)}>
              This version of Brave Ads is part of a test which&nbsp;
              <b className={css(styles.p3_b)}>sends your browsing history to Brave</b>.
              If you’re not part of this test program, you should not be using this<br />
              version of Brave.
            </p>
            <p className={css(styles.p3, styles.pr_no)}>
              <a href='https://brave.com/privacy' target='_blank' className={css(styles.link)}>Learn more</a>
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
    minHeight: '3249px',
    border: 0
  },

  et_pb_section: {
    position: 'relative',
    padding: '54px 0',
    backgroundSize: 'initial',
    backgroundPosition: 'center right',
    backgroundRepeat: 'no-repeat',
    backgroundImage: 'url(https://brave.mystagingwebsite.com/wp-content/uploads/2018/05/ads_welcome_BG.png),radial-gradient(circle at top left,#5c58c2 10%,#5c58c2 100%) !important'
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
    fontSize: '18px',
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
  }
})

module.exports = <AboutWelcome />
