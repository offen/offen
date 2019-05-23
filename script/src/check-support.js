module.exports = checkSupport

// checkSupport ensures all features the application assumes present are
// supported by the browser that is running the script and that "Do Not Track"
// is not enabled.
function checkSupport (callback) {
  var err = null

  if (!allowsTracking()) {
    err = new Error('Browser has "Do Not Track" setting enabled')
  }
  if (!err && !supportsPromises()) {
    err = new Error('Browser does not support Promises which is required')
  }
  if (!supportsWebCrypto()) {
    err = new Error('Browser does not support WebCrypto which is required')
  }
  if (!supportsIndexedDb()) {
    err = new Error('Browser does not support IndexedDB which is required')
  }

  setTimeout(function () {
    callback(err)
  }, 0)
}

function supportsWebCrypto () {
  return !!(window.crypto && window.crypto.subtle)
}

function supportsIndexedDb () {
  return typeof window.indexedDB === 'object'
}

function supportsPromises () {
  return typeof window.Promise === 'function'
}

function allowsTracking () {
  // TODO: ideally, the CDN serving this script would already drop the request
  // requesting this script, but it's probably good to keep this in here anyways
  return !navigator.doNotTrack
}
