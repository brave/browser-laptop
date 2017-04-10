const ImmutableComponent = require('../../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../styles/global')

class PreferenceNavigationButton extends ImmutableComponent {
  render () {
    return <div className={css(
      styles.prefNavItem,
      this.props.selected && styles.topBarButtonSelected,
      this.props.notImplemented && styles.notImplemented
    )}>
      <div onClick={this.props.onClick} className={css(styles.topBarButton)}>
        <div className={css(
          styles.icon,
          this.props.selected && styles.iconActive,
          this.props.icon)} />
        <div className={css(styles.text)} data-l10n-id={this.props.dataL10nId} />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  prefNavItem: {
    position: 'relative',
    display: 'block',
    width: '100%'
  },

  notImplemented: {
    display: 'none'
  },

  topBarButton: {
    position: 'relative',
    display: 'flex',
    flex: '1',
    alignItems: 'center',
    background: 'transparent',
    userSelect: 'none',
    padding: '11px 11px 11px 17px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: globalStyles.color.darkGray
    }
  },

  topBarButtonSelected: {
    backgroundColor: globalStyles.color.mediumGray,

    ':after': {
      content: '\'\'',
      borderWidth: '8px 8px 0',
      borderStyle: 'solid',
      borderColor: `${globalStyles.color.mediumGray} transparent transparent`,
      height: '0',
      left: 'calc(100% - 6px)',
      transform: 'rotateZ(-90deg)',
      position: 'absolute',
      width: '0',
      top: 'calc(50% - 4px)'
    },

    ':hover:after': {
      borderColor: `${globalStyles.color.darkGray} transparent transparent`
    }
  },

  icon: {
    display: 'block',
    width: '1.4em',
    height: '1.4em',
    WebkitMaskSize: 'contain',
    marginRight: '9px',
    backgroundColor: '#ffffff'
  },

  iconActive: {
    backgroundColor: '#ff5000'
  },

  text: {
    color: '#ffffff'
  }
})

module.exports = PreferenceNavigationButton
