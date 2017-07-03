/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')

// This component normalizes the wrapper for buttons called on files
// under app/renderer/components/navigation/buttons/ ro reduce the risk of
// visual regressions and style inconsistency.
// Ref https://github.com/brave/browser-laptop/pull/9299#discussion_r124714562

// TODO (Cezar): Check if stateless components can benefit
// from reduxComponent by setting ownProps to stateless props.
class NavigationBarButtonContainer extends React.Component {
  render () {
    return (
      <div className={css(
        // Used for bookmarkButtonContainer, PublisherToggle, noScriptInfo, and UrlBarIcon.
        this.props.isSquare && styles.container_square,

        // isNested and isStandalone should not be called at the same time
        // Add border to the bookmark button and publisher button only
        this.props.isNested && styles.container_nested,

        // Used for stopButton, reloadButton, and homeButton on navigationBar.js
        // and backButton and forwardButton on navigator.js
        this.props.isStandalone && styles.container_standalone,

        // Used for stopButton, reloadButton, and homeButton on navigationBar.js
        // NOT used for the backButton and forwardButton
        this.props.onNavigationBarChrome && styles.container_chromeButton,

        // BEM style class name unique for each component
        this.props.containerFor
      )}
        data-test-id={this.props.testId}>
        {this.props.children}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  // #9283
  // Create 25x25 square and place the button at the center of each container
  container_square: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: globalStyles.navigationBar.urlbarForm.height,
    width: globalStyles.navigationBar.urlbarForm.height,
    minHeight: globalStyles.navigationBar.urlbarForm.height,
    minWidth: globalStyles.navigationBar.urlbarForm.height,
    WebkitAppRegion: 'no-drag'
  },

  container_nested: {
    border: `1px solid ${globalStyles.color.urlBarOutline}`,
    borderRadius: globalStyles.radius.borderRadiusURL
  },

  container_standalone: {
    display: 'inline-block',
    borderRadius: globalStyles.radius.borderRadiusNavigationButton,
    height: globalStyles.navigationBar.urlbarForm.height,
    marginRight: globalStyles.navigationBar.navigationButtonContainer.marginRight,

    ':hover': {
      background: '#fff',
      boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.15)'
    }
  },

  container_chromeButton: {
    width: globalStyles.navigationBar.navigationButtonContainer.width
  }
})

module.exports = NavigationBarButtonContainer
