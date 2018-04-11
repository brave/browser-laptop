/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// https://developer.chrome.com/extensions/privacy#type-IPHandlingPolicy
// see src/content/public/common/webrtc_ip_handling_policy.h for descriptions
module.exports = {
  // This is the default behavior of Chrome. Currently, WebRTC has the right to
  // enumerate all interfaces and bind them to discover public interfaces.
  default: 'default',
  // WebRTC should only use the default route used by http. This also exposes
  // the  associated default private address. Default route is the route chosen
  // by the OS on a multi-homed endpoint.
  publicPrivate: 'default_public_and_private_interfaces',
  // WebRTC should only use the default route used by http. This doesn't
  // expose any local addresses.
  publicOnly: 'default_public_interface_only',
  // WebRTC should only use TCP to contact peers or servers unless the proxy
  // server supports UDP. This doesn't expose any local addresses either.
  disableNonProxiedUdp: 'disable_non_proxied_udp'
}
