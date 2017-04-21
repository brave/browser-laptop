/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

class SectionTitleWrapper extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.userSelectNone,
      styles.sectionTitleWrapper,
      this.props['data-beta'] && sectionTitleStyles.beta
    )} {...this.props} />
  }
}

class SectionTitleLabelWrapper extends ImmutableComponent {
  render () {
    return <SectionTitleWrapper data-beta='true' {...this.props} />
  }
}

class DefaultSectionTitle extends ImmutableComponent {
  render () {
    return <header className={css(styles.sectionTitleWrapper)}>
      <h1 className={css(
        commonStyles.userSelectNone,
        styles.sectionTitle
      )} {...this.props} />
    </header>
  }
}

class AboutPageSectionTitle extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.userSelectNone,
      styles.sectionTitle,
      styles.prefSectionTitle,
      styles.aboutPageSectionTitle,
      this.props['data-subTitle'] && styles.aboutPageSectionSubTitle
    )} {...this.props} />
  }
}

class AboutPageSectionSubTitle extends ImmutableComponent {
  render () {
    return <AboutPageSectionTitle data-subTitle='true' {...this.props} />
  }
}

class SectionLabelTitle extends ImmutableComponent {
  render () {
    return <sup className={css(
      commonStyles.userSelectNone,
      styles.sectionLabelTitle
    )} {...this.props} />
  }
}

const styles = StyleSheet.create({
  sectionTitleWrapper: {
    marginBottom: '0.7rem',
    display: 'flex',
    alignItems: 'flex-end'
  },

  sectionTitle: {
    color: globalStyles.color.darkGray,
    cursor: 'default',
    fontSize: '1.2rem',
    margin: 0,

    // Copied from common.less
    fontWeight: 400,
    WebkitFontSmoothing: 'antialiased'
  },
  prefSectionTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.75rem'
  },
  sectionLabelTitle: {
    color: '#999',
    fontSize: '15px'
  },

  aboutPageSectionTitle: {
    display: 'inline-block'
  },
  aboutPageSectionSubTitle: {
    fontSize: '16px',
    marginBottom: '12px',

    // cf: .siteDetailsPage .siteDetailsPageContent
    marginTop: '24px'
  }
})

const sectionTitleStyles = StyleSheet.create({
  beta: {
    display: 'flex',
    alignItems: 'flex-start'
  }
})

module.exports = {
  sectionTitleStyles,

  SectionTitleWrapper,
  SectionTitleLabelWrapper,

  DefaultSectionTitle,
  SectionLabelTitle,
  AboutPageSectionTitle,
  AboutPageSectionSubTitle
}
