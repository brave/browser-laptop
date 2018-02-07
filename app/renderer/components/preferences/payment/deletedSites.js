/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Actions
const aboutActions = require('../../../../../js/about/aboutActions')
const appActions = require('../../../../../js/actions/appActions')

// Components
const BrowserButton = require('../../common/browserButton')
const ImmutableComponent = require('../../immutableComponent')

// Style
const globalStyles = require('../../styles/global')

const permissionName = 'ledgerPaymentsShown'

class DeletedSitesContent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.deletePermission = this.deletePermission.bind(this)
  }

  deletePermission (name, hostPattern) {
    appActions.removeSiteSetting(hostPattern, name)
    this.props.onHide()
  }

  render () {
    return <div id='sitePermissionsPage'>
      <ul className={css(styles.sitePermissions__list)}>
        {
          this.props.sites.map(hostPattern => {
            return <div className={css(styles.sitePermissions__list__item)}>
              <BrowserButton
                iconOnly
                iconClass={globalStyles.appIcons.remove}
                size='1rem'
                custom={styles.sitePermissions__list__item__button}
                onClick={this.deletePermission.bind(this, permissionName, hostPattern)}
              />
              <span>{hostPattern}</span>
            </div>
          })
        }
      </ul>
    </div>
  }
}

class DeletedSitesFooter extends ImmutableComponent {
  clearPermissions (name) {
    aboutActions.clearSiteSettings(name)
    this.props.onHide()
  }

  render () {
    return <section>
      <BrowserButton groupedItem secondaryColor
        l10nId='clearAll'
        testId='clearAll'
        onClick={this.clearPermissions.bind(this, 'ledgerPaymentsShown')}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='done'
        testId='doneButton'
        onClick={this.props.onHide}
      />
    </section>
  }
}

const styles = StyleSheet.create({
  sitePermissions__list: {
    listStyle: 'none'
  },

  sitePermissions__list__item: {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1.4
  },

  sitePermissions__list__item__button: {
    marginRight: '.25rem',
    color: globalStyles.color.braveOrange,

    ':hover': {
      color: globalStyles.color.braveOrange
    }
  },

  sitePermissions__list__item__status: {
    marginLeft: '.5ch',
    fontStyle: 'italic'
  }
})

module.exports = {
  DeletedSitesContent,
  DeletedSitesFooter
}
