/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Utils
const cx = require('../../../../../js/lib/classSet')

// style
const globalStyles = require('../../styles/global')

class DisabledContent extends ImmutableComponent {
  render () {
    return <section className={css(styles.disabledContent)} data-test-id='disabledContent'>
      <div>
        <div className={css(styles.disabledContent__wrapper)} data-test-id='paymentsMessage'>
          <div className={cx({
            [css(styles.disabledContent__message)]: true,
            disabledLedgerContent: true
          })} data-test-id='paymentsMessage'>
            <div>
              <h3 className={css(styles.disabledContent__message__header)}>Really good ads</h3>
              <p className={css(styles.disabledContent__commonText)}>
                Lorem ipsum dolor sit amet, quo in oblique detraxit singulis, prima inimicus torquatos cu duo.
                Atqui congue denique eum ne, has dignissim consetetur ne, nam putent pericula at. Usu id euismod
                propriae phaedrum, sententiae quaerendum mei ei. No qui sanctus epicurei, ne his quaeque efficiantur,
                audire veritus apeirian pro ut.
              </p>
              <p className={css(styles.disabledContent__commonText)}>
                Ut mea erroribus salutatus, no eruditi equidem pericula sea, no vis affert labore sanctus.
                Sea oratio salutandi ut. Nam cu quas option complectitur.
                Ius case reprehendunt ex.
              </p>
              <p className={css(styles.disabledContent__commonText)}>
                Per te laudem altera invidunt, vitae legere interesset mel ea, tota alterum detraxit at pro.
                Ius id dicit propriae. Cu dico copiosae dissentias sit, usu dicam scripserit ea, quo in primis suscipit.
                Ius laudem suscipiantur eu, nominavi invenire assentior an has, ea pri inermis sententiae.
              </p>
            </div>
          </div>
          <div className={css(styles.disabledContent__message__toc)}>
            <a
              data-l10n-id='termsOfService'
              data-test-id='termsOfService'
              className={css(styles.disabledContent__message__toc__link)}
              href='https://basicattentiontoken.org/contributor-terms-of-service/'
              target='_blank'
              rel='noreferrer noopener'
            />
          </div>
          <div className={css(styles.disabledContent__footer)}>
            <div className={css(styles.disabledContent__commonText)}>
              Cu vis brute scriptorem disputationi, rebum aperiam ea mel, virtute vulputate instructior an sit.
              Fugit accusam percipit ius at, et disputando deterruisset ius. Ex solet salutandi vis.
              Ei harum laoreet nec, eu pro reque dicat sensibus.
            </div>
            <div className={css(styles.disabledContent__commonText)}>
              Vel dicunt persius ea, cum adhuc inermis fuisset et. In nam illud efficiantur, sed an diam nominavi.
              Magna labore appellantur ea vix, veri magna contentiones sed ne. Per ne eros sanctus adolescens.
            </div>
          </div>
        </div>
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  disabledContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'left',
    marginTop: globalStyles.spacing.panelMargin
  },

  disabledContent__commonText: {
    padding: '0.5em 0'
  },

  disabledContent__wrapper: {
    fontSize: globalStyles.payments.fontSize.regular,
    color: globalStyles.color.mediumGray,
    maxWidth: '570px'
  },

  disabledContent__message: {
    backgroundColor: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.8em'
  },

  disabledContent__message__header: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  disabledContent__message__toc: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    padding: '20px 0'
  },

  disabledContent__message__toc__link: {
    fontSize: '13px',
    color: '#666'
  },

  disabledContent__footer: {
    lineHeight: '1.2em',
    padding: '20px'
  }
})

module.exports = DisabledContent
