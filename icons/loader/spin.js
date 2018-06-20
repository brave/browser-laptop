const { css, StyleSheet } = require('aphrodite/no-important')
const React = require('react')

module.exports = class Loader extends React.PureComponent {
  render () {
    return <div
      className={css(styles.loader, this.props.styles)}
    />
  }
}

const styles = StyleSheet.create({
  loader: {
    borderRadius: '50%',
    width: 'var(--loader-size)',
    height: 'var(--loader-size)',
    position: 'relative',
    border: 'var(--loader-stroke) solid rgba(257, 85, 38, .2)',
    borderLeftColor: '#d75526 !important',
    willChange: 'transform',
    animationName: {
      '0%': {
        transform: 'rotate(0deg)'
      },
      '100%': {
        transform: 'rotate(360deg)'
      }
    },
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    anitmationTimingFunction: 'ease'
  }
})
