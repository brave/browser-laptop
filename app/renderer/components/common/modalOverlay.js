/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')
const Button = require('./button')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const closeButton = require('../../../../img/toolbar/stoploading_btn.svg')

/**
 * Represents a modal overlay
 */

var globalInstanceCounter = 0
var mountedInstances = []

class ModalOverlay extends ImmutableComponent {
  componentWillMount () {
    this.instanceId = globalInstanceCounter++

    this.setState({last: true})

    if (mountedInstances.length) {
      let lastModal = mountedInstances[mountedInstances.length - 1]
      lastModal.setState({last: false})
      lastModal.forceUpdate()
    }

    mountedInstances.push(this)
  }

  componentWillUnmount () {
    let instId = this.instanceId

    mountedInstances = mountedInstances.filter(function (inst) {
      return inst.instanceId !== instId
    })

    if (mountedInstances.length) {
      let lastModal = mountedInstances[mountedInstances.length - 1]
      lastModal.setState({last: true})
      lastModal.forceUpdate()
    }
  }

  get dialogContent () {
    var close = null
    var title = null

    const customDialogClassesStr = this.props.customDialogClasses ? this.props.customDialogClasses : ''
    const customDialogHeaderClassesStr = this.props.customDialogHeaderClasses ? this.props.customDialogHeaderClasses : ''
    const customDialogBodyWrapperClassesStr = this.props.customDialogBodyWrapperClasses ? this.props.customDialogBodyWrapperClasses : ''
    const customDialogBodyClassesStr = this.props.customDialogBodyClasses ? this.props.customDialogBodyClasses : ''
    const customDialogFooterClassesStr = this.props.customDialogFooterClasses ? this.props.customDialogFooterClasses : ''
    const customTitleClassesStr = this.props.customTitleClasses ? this.props.customTitleClasses : ''

    if (!this.props.emptyDialog) {
      close = (this.props.onHide
        ? <Button className={css(styles.dialog__header__close)}
          testId='modalCloseButton'
          onClick={this.props.onHide}
        /> : null)
      title = (this.props.title
        ? <div className={cx({
          [css(styles.dialog__header__title)]: true,
          [customTitleClassesStr]: true
        })} data-l10n-id={this.props.title}
        /> : null)
    }

    return <section className={cx({
      [css(styles.dialog)]: true,
      [customDialogClassesStr]: true
    })}>

      <header className={cx({
        [css(styles.dialog__header)]: true,
        [customDialogHeaderClassesStr]: true
      })}>
        {title}
        {close}
      </header>

      <section className={cx({
        [css(styles.dialog__body__wrapper)]: true,
        [customDialogBodyWrapperClassesStr]: true
      })}>
        <div className={cx({
          [css(styles.dialog__body)]: true,
          [customDialogBodyClassesStr]: true
        })}>
          {this.props.content}
        </div>
      </section>

      <footer className={cx({
        [css(styles.dialog__footer)]: true,
        [customDialogFooterClassesStr]: true
      })}>
        {this.props.footer}
      </footer>
    </section>
  }

  render () {
    return <div className={cx({
      [css(styles.dialog__wrapper_modal)]: true,
      [css(styles.dialog__wrapper_last)]: this.state.last,
      [css(styles.dialog__wrapper_transparentBackground)]: this.props.transparentBackground
    })} role='alert'>
      {this.dialogContent}
    </div>
  }
}

const buttonSize = '15px'

const styles = StyleSheet.create({
  dialog__wrapper_modal: {
    opacity: 1,
    overflow: 'auto',
    position: 'fixed',
    background: 'transparent',
    width: '100vw',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: globalStyles.zindex.zindexModal
  },
  dialog__wrapper_last: {
    background: globalStyles.color.black25
  },
  dialog__wrapper_transparentBackground: {
    background: 'transparent'
  },

  dialog: {
    boxSizing: 'border-box',
    cursor: 'default',
    width: '700px',
    margin: '0 auto',
    marginTop: '50px',
    background: `linear-gradient(${globalStyles.color.modalVeryLightGray}, ${globalStyles.color.modalLightGray})`,
    border: `solid 1px ${globalStyles.color.lightGray}`,
    borderRadius: globalStyles.radius.borderRadiusModal,
    boxShadow: globalStyles.shadow.dialogShadow,
    position: 'relative',
    userSelect: 'none',
    zIndex: globalStyles.zindex.zindexDialogs
  },

  dialog__header: {
    padding: `25px ${globalStyles.spacing.modalDialogPaddingHorizontal}`
  },
  dialog__header__close: {
    display: 'inline-block',
    position: 'absolute',
    right: buttonSize,
    top: buttonSize,
    height: buttonSize,
    width: buttonSize,
    cursor: 'pointer',

    // TODO: refactor button to remove !important
    padding: '0 !important',
    background: `url(${closeButton}) center no-repeat !important`,
    backgroundSize: `${buttonSize} ${buttonSize} !important`,

    ':focus': {
      outline: 'none'
    }
  },
  dialog__header__title: {
    fontSize: '22px',
    color: globalStyles.color.darkGray,
    marginBottom: 0
  },

  dialog__body__wrapper: {
    borderRadius: globalStyles.radius.borderRadiusModal
  },
  dialog__body: {
    background: '#fff',
    padding: `${globalStyles.spacing.dialogInsideMargin} ${globalStyles.spacing.modalDialogPaddingHorizontal}`
  },

  dialog__footer: {
    padding: '20px',
    paddingLeft: globalStyles.spacing.modalDialogPaddingHorizontal,
    display: 'flex',
    flexFlow: 'nowrap',
    justifyContent: 'flex-end'
  }
})

module.exports = ModalOverlay
