/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')

// TODO: Check if stateless components can benefit from reduxComponent
// by setting ownProps to stateless props.
class NavigationBarButtonContainer extends React.Component {
  render () {
    return (
      <div className={css(
        this.props.isBoxed && styles.boxed,
        this.props.isNested && styles.nestedContainer,
        this.props.isStandalone && styles.standaloneContainer,
        // BEM style class name unique for each component
        this.props.containerFor
      )}>
        {this.props.children}
      </div>
    )
  }
}

const styles = StyleSheet.create({
  // #9283
  // Create 25x25 squares and place the buttons at the center of each container
  // Used for bookmarkButtonContainer, PublisherToggle, noScriptInfo, and UrlBarIcon.
  boxed: {
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

  // Add border to the bookmark button and publisher button only
  nestedContainer: {
    border: `1px solid ${globalStyles.color.urlBarOutline}`,
    borderRadius: globalStyles.radius.borderRadiusURL
  },

  // Used for stopButton, reloadButton, and homeButton on navigationBar.js
  // and backButton and forwardButton on navigator.js
  standaloneContainer: {
    display: 'inline-block',
    borderRadius: globalStyles.radius.borderRadiusNavigationButton,
    height: globalStyles.navigationBar.urlbarForm.height,
    marginRight: globalStyles.navigationBar.navigationButtonContainer.marginRight,

    ':hover': {
      background: '#fff',
      boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.15)'
    }
  }
})

module.exports = NavigationBarButtonContainer
