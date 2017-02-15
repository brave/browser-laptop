/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../styles/global')

class HelpfulHints extends ImmutableComponent {
  render () {
    return <div className={css(styles.helpfulHints)}>
      <span className={css(styles.hintsTitleContainer)}>
        <span className={css(styles.white)} data-l10n-id='hintsTitle' />
        <span className={globalStyles.appIcons.refresh} onClick={this.props.refreshHint}
          style={{
            color: 'white',
            marginLeft: '15px',
            fontSize: 'smaller'
          }}
        />
      </span>
      <div className={css(styles.hints, styles.white)} data-l10n-id={`hint${this.props.hintNumber}`} />
      <div className={css(styles.helpfulHintsBottom)}>
        <a className={css(styles.white)}
          target='_blank' href='https://community.brave.com/'
          data-l10n-id='submitFeedback' />
      </div>
    </div>
  }
}

const common = {
  fontSize: '0.8em',
  margin: '8px 10px 15px 18px'
}

const styles = StyleSheet.create({
  white: {
    color: 'white'
  },

  helpfulHints: {
    width: '100%',
    height: '100%',
    cursor: 'default',
    padding: '30px 0',
    marginTop: '20px'
  },

  hintsTitleContainer: {
    WebkitUserSelect: 'none',
    WebkitAppRegion: 'no-drag',
    fontSize: 'inherit',
    fontWeight: 'normal',
    margin: '18px'
  },

  hints: common,
  helpfulHintsBottom: common
})

module.exports = HelpfulHints
