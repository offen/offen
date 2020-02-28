module.exports = checkSupport

// checkSupport ensures all features the application assumes present are
// supported by the browser that is running the script.
// It is important that this does use a callback interface
// as it native Promises might not necessarily be supported.
function checkSupport (callback) {
  var err = null
  if (!supportsIndexedDb()) {
    err = new Error(__('Browser does not support IndexedDB which is required'))
  }
  setTimeout(function () {
    callback(err)
  }, 0)
}

function supportsIndexedDb () {
  // this implictly guarantees native Promises are available
  return typeof window.indexedDB === 'object'
}
