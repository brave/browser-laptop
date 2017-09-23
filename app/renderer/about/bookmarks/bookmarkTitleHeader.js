/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../components/immutableComponent')
const BrowserButton = require('../../components/common/browserButton')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

const globalStyles = require('../../components/styles/global')
const addBookmark = require('../../../../img/toolbar/add_bookmark_btn.svg')

class BookmarkTitleHeader extends ImmutableComponent {
  constructor () {
    super()
    this.addBookmark = this.addBookmark.bind(this)
  }
  addBookmark () {
    const newBookmark = Immutable.fromJS({
      parentFolderId: this.props.selectedFolderId
    })
    windowActions.addBookmark(newBookmark)
  }
  render () {
    return <div>
      <span data-l10n-id={this.props.heading} />
      <BrowserButton
        isMaskImage
        custom={styles.header__addBookmark}
        l10nId='addBookmark'
        testId='addBookmark'
        onClick={this.addBookmark}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  header__addBookmark: {
    backgroundColor: globalStyles.color.buttonColor,
    width: '20px',
    height: '20px',
    WebkitMaskImage: `url(${addBookmark})`,
    WebkitMaskRepeat: 'no-repeat'
  }
})

module.exports = BookmarkTitleHeader
