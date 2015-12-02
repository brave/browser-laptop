export default function debounce (fn, bufferInterval, ...args) {
  var timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(fn.apply.bind(fn, this, args), bufferInterval)
  }
}
