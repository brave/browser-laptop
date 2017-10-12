/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class List extends ImmutableComponent {
  render () {
    const className = css(
      this.props['data-isDownload'] && styles.isDownload
    )

    return <div className={className} {...this.props} />
  }
}

class DownloadList extends ImmutableComponent {
  render () {
    return <List data-isDownload='true' {...this.props} />
  }
}

const styles = StyleSheet.create({
  isDownload: {
    marginTop: globalStyles.spacing.aboutPageSectionMargin,
    overflow: 'hidden'
  }
})

module.exports = {
  List,
  DownloadList
}
