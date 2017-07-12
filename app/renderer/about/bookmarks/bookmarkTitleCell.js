/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../components/immutableComponent')

// Constants
const {iconSize} = require('../../../../js/constants/config')

// Utils
const cx = require('../../../../js/lib/classSet')
const bookmarkFoldersUtil = require('../../../common/lib/bookmarkFoldersUtil')

class BookmarkTitleCell extends ImmutableComponent {
  render () {
    let iconStyle
    const icon = this.props.siteDetail.get('favicon')
    if (!bookmarkFoldersUtil.isFolder(this.props.siteDetail)) {
      if (icon) {
        iconStyle = {
          minWidth: iconSize,
          width: iconSize,
          backgroundImage: `url(${icon})`,
          backgroundSize: iconSize,
          height: iconSize
        }
      }
    }

    const bookmarkTitle = this.props.siteDetail.get('title')
    const bookmarkLocation = this.props.siteDetail.get('location')
    const defaultIcon = 'fa fa-file-o'

    return <div>
      {
        <span
          className={cx({
            bookmarkFavicon: true,
            bookmarkFile: !icon,
            [defaultIcon]: !icon
          })}
          style={iconStyle}
        />
      }
      <span>{bookmarkTitle || bookmarkLocation}</span>
      {
        bookmarkTitle ? <span className='bookmarkLocation'>{bookmarkLocation}</span> : null
      }
    </div>
  }
}

module.exports = BookmarkTitleCell
