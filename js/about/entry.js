import { getSourceAboutUrl } from '../lib/appUrlUtil.js'

switch(getSourceAboutUrl(window.location.href)) {
  case 'about:newtab':
    require('./newtab')
    break
  case 'about:about':
    require('./about')
    break
}
