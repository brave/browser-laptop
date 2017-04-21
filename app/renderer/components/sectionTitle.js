/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')

class SectionTitleWrapper extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.userSelectNone,
      styles.sectionTitleWrapper,
      this.props['data-beta'] && sectionTitleStyles.beta
    )} {...this.props} />
  }
}

class BetaSectionTitleWrapper extends ImmutableComponent {
  render () {
    return <SectionTitleWrapper data-beta='true' {...this.props} />
  }
}

class DefaultSectionTitle extends ImmutableComponent {
  render () {
    return <header className={css(styles.sectionTitleWrapper)}>
      <h1 className={css(
        commonStyles.userSelectNone,
        styles.sectionTitle)} {...this.props} />
    </header>
  }
}

class PrefSectionTitle extends ImmutableComponent {
  render () {
    return <header className={css(styles.sectionTitleWrapper)}>
      <h1 className={css(
        commonStyles.userSelectNone,
        styles.sectionTitle,
        styles.prefSectionTitle)} {...this.props} />
    </header>
  }
}

class AboutPagesSectionTitle extends ImmutableComponent {
  render () {
    return <div className={css(
      commonStyles.userSelectNone,
      styles.sectionTitle,
      styles.prefSectionTitle,
      styles.aboutPagesSectionTitle,
      this.props['data-subTitle'] && styles.aboutPagesSectionSubTitle
    )} {...this.props} />
  }
}

class AboutPagesSectionSubTitle extends ImmutableComponent {
  render () {
    return <AboutPagesSectionTitle data-subTitle='true' {...this.props} />
  }
}

class SectionSubTitle extends ImmutableComponent {
  render () {
    return <sup className={css(
      commonStyles.userSelectNone,
      styles.sectionSubTitle)} {...this.props} />
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
    fontSize: '1.2rem'
  },
  prefSectionTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.75rem',
    marginBottom: '8px'
  },

  aboutPagesSectionTitle: {
    display: 'inline-block',
    marginBottom: 0
  },

  aboutPagesSectionSubTitle: {
    fontSize: '16px',
    marginBottom: '12px',

    // cf: .siteDetailsPage .siteDetailsPageContent
    marginTop: '24px'
  },

  sectionSubTitle: {
    color: '#999',
    fontSize: '15px'
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
  BetaSectionTitleWrapper,

  DefaultSectionTitle,
  PrefSectionTitle,
  AboutPagesSectionTitle,
  AboutPagesSectionSubTitle,

  SectionSubTitle
}
