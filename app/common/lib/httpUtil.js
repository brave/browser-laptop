/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Returns true if the error code is a frame error
 * @param {number} errorCode the error code
 */
module.exports.isFrameError = function (errorCode) {
  errorCode = Math.abs(errorCode)

  // cert errors are currently handled separately
  if (errorCode === 501 || (errorCode >= 200 && errorCode <= 299)) {
    return false
  }
  // ignore cache errors except cache miss (form repost)
  if (errorCode > 400 && errorCode <= 499) {
    return false
  }

  return errorCode >= 100 && errorCode <= 899
}

module.exports.isAborted = function (errorCode) {
  errorCode = Math.abs(errorCode)
  return errorCode === 3
}

/**
 * Gets the l10n id for the chrome error code
 * @param {number} errorCode the error code
 */
module.exports.l10nErrorText = function (errorCode) {
  errorCode = Math.abs(errorCode)
  // TODO(bridiver) - error pages should not restore on browser reload
  //     0- 99 System related errors
  //   100-199 Connection related errors
  //   200-299 Certificate errors
  //   300-399 HTTP errors
  //   400-499 Cache errors
  //   600-699 FTP errors
  //   700-799 Certificate manager errors
  //   800-899 DNS resolver errors
  let title = module.exports.errorMap[errorCode]
  if (!title) {
    if (errorCode >= 100 && errorCode <= 199) {
      title = 'networkError'
    } else if (errorCode >= 300 && errorCode <= 399) {
      title = 'httpError'
    } else if (errorCode >= 600 && errorCode <= 699) {
      title = 'ftpError'
    } else if (errorCode >= 800 && errorCode <= 899) {
      title = 'dnsError'
    } else if (errorCode === 400) {
      title = 'cacheError'
    } else {
      title = 'unknownError'
    }
  }
  return title
}

module.exports.errorMap = {
  // An operation was aborted (due to user action).
  3: 'aborted',
  // A connection was reset (corresponding to a TCP RST).
  101: 'connectionReset',
  // A connection attempt was refused.
  102: 'connectionRefused',
  // A connection timed out as a result of not receiving an ACK for data sent.
  // This can include a FIN packet that did not get ACK'd.
  103: 'connectionAborted',
  // A connection attempt failed.
  104: 'connectionFailed',
  // The host name could not be resolved.
  105: 'nameNotResolved',
  // The Internet connection has been lost.
  106: 'internetDisconnected',
  // An SSL protocol error occurred.
  107: 'sslProtocolError',
  // The IP address or port number is invalid (e.g., cannot connect to the IP
  // address 0 or the port 0).
  108: 'addressInvalid',
  // The IP address is unreachable.  This usually means that there is no route to
  // the specified host or network.
  109: 'addressUnreachable',
  // The server requested a client certificate for SSL client authentication.
  110: 'sslClientAuthCertNeeded',
  // A tunnel connection through the proxy could not be established.
  111: 'tunnelConnectionFailed',
  // No SSL protocol versions are enabled.
  112: 'noSslVersionsEnabled',
  // The client and server don't support a common SSL protocol version or
  // cipher suite.
  113: 'sslVersionOrCipherMismatch',
  // The server requested a renegotiation (rehandshake).
  114: 'sslRenegotiationRequested',
  // The proxy requested authentication (for tunnel establishment) with an
  // unsupported method.
  115: 'proxyAuthUnsupported',
  // During SSL renegotiation (rehandshake), the server sent a certificate with
  // an error.
  //
  // Note: this error is not in the -2xx range so that it won't be handled as a,
  // certificate error.
  116: 'certErrorInSslRenegotiation',
  // The SSL handshake failed because of a bad or missing client certificate.
  117: 'badSslClientAuthCert',
  // A connection attempt timed out.
  118: 'connectionTimedOut',
  // There are too many pending DNS resolves, so a request in the queue was
  // aborted.
  119: 'hostResolverQueueTooLarge',
  // Failed establishing a connection to the SOCKS proxy server for a target host.
  120: 'socksConnectionFailed',
  // The SOCKS proxy server failed establishing connection to the target host
  // because that host is unreachable.
  121: 'socksConnectionHostUnreachable',
  // The request to negotiate an alternate protocol failed.
  122: 'npnNegotiationFailed',
  // The peer sent an SSL no_renegotiation alert message.
  123: 'sslNoRenegotiation',
  // Winsock sometimes reports more data written than passed.  This is probably
  // due to a broken LSP.
  124: 'winsockUnexpectedWrittenBytes',
  // An SSL peer sent us a fatal decompression_failure alert. This typically
  // occurs when a peer selects DEFLATE compression in the mistaken belief that
  // it supports it.
  125: 'sslDecompressionFailureAlert',
  // An SSL peer sent us a fatal bad_record_mac alert. This has been observed
  // from servers with buggy DEFLATE support.
  126: 'sslBadRecordMacAlert',
  // The proxy requested authentication (for tunnel establishment).
  127: 'proxyAuthRequested',
  // The SSL server attempted to use a weak ephemeral Diffie-Hellman key.
  129: 'sslWeakServerEphemeralDhKey',
  // Could not create a connection to the proxy server. An error occurred
  // either in resolving its name, or in connecting a socket to it.
  // Note that this does NOT include failures during the actual "CONNECT" method
  // of an HTTP proxy.
  130: 'proxyConnectionFailed',
  // A mandatory proxy configuration could not be used. Currently this means
  // that a mandatory PAC script could not be fetched, parsed or executed.
  131: 'mandatoryProxyConfigurationFailed',
  // We've hit the max socket limit for the socket pool while preconnecting.  We
  // don't bother trying to preconnect more sockets.
  133: 'preconnectMaxSocketLimit',
  // The permission to use the SSL client certificate's private key was denied.
  134: 'sslClientAuthPrivateKeyAccessDenied',
  // The SSL client certificate has no private key.
  135: 'sslClientAuthCertNoPrivateKey',
  // The certificate presented by the HTTPS Proxy was invalid.
  136: 'proxyCertificateInvalid',
  // An error occurred when trying to do a name resolution (DNS).
  137: 'nameResolutionFailed',
  // Permission to access the network was denied. This is used to distinguish
  // errors that were most likely caused by a firewall from other access denied
  // errors. See also ERR_ACCESS_DENIED.
  138: 'networkAccessDenied',
  // The request throttler module cancelled this request to avoid DDOS.
  139: 'temporarilyThrottled',
  // A request to create an SSL tunnel connection through the HTTPS proxy
  // received a non-200 (OK) and non-407 (Proxy Auth) response.  The response
  // body might include a description of why the request failed.
  140: 'httpsProxyTunnelResponse',
  // We were unable to sign the CertificateVerify data of an SSL client auth
  // handshake with the client certificate's private key.
  //
  // Possible causes for this include the user implicitly or explicitly
  // denying access to the private key, the private key may not be valid for
  // signing, the key may be relying on a cached handle which is no longer
  // valid, or the CSP won't allow arbitrary data to be signed.
  141: 'sslClientAuthSignatureFailed',
  // The message was too large for the transport.  (for example a UDP message
  // which exceeds size threshold).
  142: 'msgTooBig',
  // A SPDY session already exists, and should be used instead of this connection.
  143: 'spdySessionAlreadyExists',
  // Websocket protocol error. Indicates that we are terminating the connection
  // due to a malformed frame or other protocol violation.
  145: 'wsProtocolError',
  // Returned when attempting to bind an address that is already in use.
  147: 'addressInUse',
  // An operation failed because the SSL handshake has not completed.
  148: 'sslHandshakeNotCompleted',
  // SSL peer's public key is invalid.
  149: 'sslBadPeerPublicKey',
  // The certificate didn't match the built-in public key pins for the host name.
  // The pins are set in net/http/transport_security_state.cc and require that
  // one of a set of public keys exist on the path from the leaf to the root.
  150: 'sslPinnedKeyNotInCertChain',
  // Server request for client certificate did not contain any types we support.
  151: 'clientAuthCertTypeUnsupported',
  // Server requested one type of cert, then requested a different type while the
  // first was still being generated.
  152: 'originBoundCertGenerationTypeMismatch',
  // An SSL peer sent us a fatal decrypt_error alert. This typically occurs when
  // a peer could not correctly verify a signature (in CertificateVerify or
  // ServerKeyExchange) or validate a Finished message.
  153: 'sslDecryptErrorAlert',
  // There are too many pending WebSocketJob instances, so the new job was not
  // pushed to the queue.
  154: 'wsThrottleQueueTooLarge',
  // The SSL server certificate changed in a renegotiation.
  156: 'ssl_server_cert_changed',
  // The SSL server indicated that an unnecessary TLS version fallback was
  // performed.
  157: 'sslInappropriateFallback',
  // Certificate Transparency: All Signed Certificate Timestamps failed to verify.,
  158: 'ctNoSctsVerifiedOk',
  // The SSL server sent us a fatal unrecognized_name alert.
  159: 'sslUnrecognizedNameAlert',
  // Failed to set the socket's receive buffer size as requested.
  160: 'socketSetReceiveBufferSizeError',
  // Failed to set the socket's send buffer size as requested.
  161: 'socketSetSendBufferSizeError',
  // Failed to set the socket's receive buffer size as requested, despite success
  // return code from setsockopt.
  162: 'socketReceiveBufferSizeUnchangeable',
  // Failed to set the socket's send buffer size as requested, despite success
  // return code from setsockopt.
  163: 'socketSendBufferSizeUnchangeable',
  // Failed to import a client certificate from the platform store into the SSL
  // library.
  164: 'sslClientAuthCertBadFormat',
  // The SSL server requires falling back to a version older than the configured
  // minimum fallback version, and thus fallback failed.
  165: 'sslFallbackBeyondMinimumVersion',
  // Resolving a hostname to an IP address list included the IPv4 address
  // "127.0.53.53". This is a special IP address which ICANN has recommended to
  // indicate there was a name collision, and alert admins to a potential
  // problem.
  166: 'icannNameCollision',
  // The SSL server presented a certificate which could not be decoded. This is
  // not a certificate error code as no X509Certificate object is available. This
  // error is fatal.
  167: 'sslServerCertBadFormat',
  // Certificate Transparency: received a signed tree head that failed to parse.,
  168: 'ctSthParsingFailed',
  // Certificate Transparency: Received a signed tree head whose JSON parsing was,
  // OK but was missing some of the fields.
  169: 'ctSthIncomplete',
  // The attempt to reuse a connection to send proxy auth credentials failed
  // before the AuthController was used to generate credentials. The caller should
  // reuse the controller with a new connection. This error is only used
  // internally by the network stack.
  170: 'unableToReuseConnectionForProxyAuth',
  // The URL is invalid.
  300: 'invalidURL',
  // The scheme of the URL is disallowed.
  301: 'disallowedURLScheme',
  // The scheme of the URL is unknown.
  302: 'unknownURLScheme',
  // Attempting to load an URL resulted in too many redirects.
  310: 'tooManyRedirects',
  // Attempting to load an URL resulted in an unsafe redirect (e.g., a redirect
  // to file:// is considered unsafe).
  311: 'unsafeRedirect',
  // Attempting to load an URL with an unsafe port number.  These are port
  // numbers that correspond to services, which are not robust to spurious input
  // that may be constructed as a result of an allowed web construct (e.g., HTTP
  // looks a lot like SMTP, so form submission to port 25 is denied).
  312: 'unsafePort',
  // The server's response was invalid.
  320: 'invalidResponse',
  // Error in chunked transfer encoding.
  321: 'invalidChunkedEncoding',
  // The server did not support the request method.
  322: 'methodNotSupported',
  // The response was 407 (Proxy Authentication Required), yet we did not send
  // the request to a proxy.
  323: 'unexpectedProxyAuth',
  // The server closed the connection without sending any data.
  324: 'emptyResponse',
  // The headers section of the response is too large.
  325: 'responseHeadersTooBig',
  // The PAC requested by HTTP did not have a valid status code (non-200).
  326: 'pacStatusNotOk',
  // The evaluation of the PAC script failed.
  327: 'pacScriptFailed',
  // The response was 416 (Requested range not satisfiable) and the server cannot
  // satisfy the range requested.
  328: 'requestRangeNotSatisfiable',
  // The identity used for authentication is invalid.
  329: 'malformedIdentity',
  // Content decoding of the response body failed.
  330: 'contentDecodingFailed',
  // An operation could not be completed because all network IO
  // is suspended.
  331: 'networkIoSuspended',
  // FLIP data received without receiving a SYN_REPLY on the stream.
  332: 'synReplyNotReceived',
  // Converting the response to target encoding failed.
  333: 'encodingConversionFailed',
  // The server sent an FTP directory listing in a format we do not understand.
  334: 'unrecognizedFtpDirectoryListingFormat',
  // Attempted use of an unknown SPDY stream id.
  335: 'invalidSpdyStream',
  // There are no supported proxies in the provided list.
  336: 'noSupportedProxies',
  // There is a SPDY protocol error.
  337: 'spdyProtocolError',
  // Credentials could not be established during HTTP Authentication.
  338: 'invalidAuthCredentials',
  // An HTTP Authentication scheme was tried which is not supported on this
  // machine.
  339: 'unsupportedAuthScheme',
  // Detecting the encoding of the response failed.
  340: 'encodingDetectionFailed',
  // (GSSAPI) No Kerberos credentials were available during HTTP Authentication.
  341: 'missingAuthCredentials',
  // An unexpected, but documented, SSPI or GSSAPI status code was returned.
  342: 'unexpectedSecurityLibraryStatus',
  // The environment was not set up correctly for authentication (for
  // example, no KDC could be found or the principal is unknown.
  343: 'misconfiguredAuthEnvironment',
  // An undocumented SSPI or GSSAPI status code was returned.
  344: 'undocumentedSecurityLibraryStatus',
  // The HTTP response was too big to drain.
  345: 'responseBodyTooBigToDrain',
  // The HTTP response contained multiple distinct Content-Length headers.
  346: 'responseHeadersMultipleContentLength',
  // SPDY Headers have been received, but not all of them - status or version
  // headers are missing, so we're expecting additional frames to complete them.
  347: 'incompleteSpdyHeaders',
  // No PAC URL configuration could be retrieved from DHCP. This can indicate
  // either a failure to retrieve the DHCP configuration, or that there was no
  // PAC URL configured in DHCP.
  348: 'pacNotInDhcp',
  // The HTTP response contained multiple Content-Disposition headers.
  349: 'responseHeadersMultipleContentDisposition',
  // The HTTP response contained multiple Location headers.
  350: 'responseHeadersMultipleLocation',
  // SPDY server refused the stream. Client should retry. This should never be a
  // user-visible error.
  351: 'spdyServerRefusedStream',
  // SPDY server didn't respond to the PING message.
  352: 'spdyPingFailed',
  // The HTTP response body transferred fewer bytes than were advertised by the
  // Content-Length header when the connection is closed.
  354: 'contentLengthMismatch',
  // The HTTP response body is transferred with Chunked-Encoding, but the
  // terminating zero-length chunk was never sent when the connection is closed.
  355: 'incompleteChunkedEncoding',
  // There is a QUIC protocol error.
  356: 'quicProtocolError',
  // The HTTP headers were truncated by an EOF.
  357: 'responseHeadersTruncated',
  // The QUIC crypto handshake failed.  This means that the server was unable
  // to read any requests sent, so they may be resent.
  358: 'quicHandshakeFailed',
  // Transport security is inadequate for the SPDY version.
  360: 'spdyInadequateTransportSecurity',
  // The peer violated SPDY flow control.
  361: 'spdyFlowControlError',
  // The peer sent an improperly sized SPDY frame.
  362: 'spdyFrameSizeError',
  // Decoding or encoding of compressed SPDY headers failed.
  363: 'spdyCompressionError',
  // Proxy Auth Requested without a valid Client Socket Handle.
  364: 'proxyAuthRequestedWithNoConnection',
  // HTTP_1_1_REQUIRED error code received on HTTP/2 session.
  365: 'http11Required',
  // HTTP_1_1_REQUIRED error code received on HTTP/2 session to proxy.
  366: 'proxyHTTP11Required',
  // The PAC script terminated fatally and must be reloaded.
  367: 'pacScriptTerminated',
  // The certificate offered by the alternative server is not valid for the
  // origin, a violation of HTTP Alternative Services specification Section 2.1,
  // https://tools.ietf.org/id/draft-ietf-httpbis-alt-svc-06.html#host_auth.
  368: 'alternativeCertNotValidForOrigin',
  // Request is throttled because of a Backoff header.
  // See: crbug.com/486891.,
  369: 'temporaryBackoff',
  400: 'cacheMiss',
  // The server's response was insecure (e.g. there was a cert error).
  501: 'insecureResponse',
  // DNS error codes.
  // DNS resolver received a malformed response.
  800: 'dnsMalformedResponse',
  // DNS server requires TCP
  801: 'dnsServerRequiresTcp',
  // DNS server failed.  This error is returned for all of the following
  // error conditions:
  // 1 - Format error - The name server was unable to interpret the query.
  // 2 - Server failure - The name server was unable to process this query
  //     due to a problem with the name server.
  // 4 - Not Implemented - The name server does not support the requested
  //     kind of query.
  // 5 - Refused - The name server refuses to perform the specified
  //     operation for policy reasons.
  802: 'dnsServerFailed',
  // DNS transaction timed out.
  803: 'dnsTimedOut',
  // The entry was not found in cache, for cache-only lookups.
  804: 'dnsCacheMiss',
  // Suffix search list rules prevent resolution of the given host name.
  805: 'dnsSearchEmpty',
  // Failed to sort addresses according to RFC3484.
  806: 'dnsSortError'
}

/**
 * Returns true if HTTP response code is one we want to collect usage for
 * @param {number} responseCode - HTTP response code to be evaluated
 * @return {boolean} true if the code represents one w/ content, false if not
 */
module.exports.responseHasContent = (responseCode) => {
  switch (responseCode) {
    case 200: // ok
    case 203: // non-authoritative
    case 206: // partial content
    case 304: // not modified (cached)
      return true
  }
  return false
}
