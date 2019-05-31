module.exports = handleFetchResponse

function handleFetchResponse (response) {
  if (response.status >= 400) {
    return response.json().then(function (errorBody) {
      var err = new Error(errorBody.error)
      err.status = response.status
      throw err
    })
  }
  if (response.status !== 204) {
    return response.json()
  }
  return null
}
