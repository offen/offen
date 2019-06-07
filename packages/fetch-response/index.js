module.exports = handleFetchResponse

function handleFetchResponse (response) {
  if (response.status >= 400) {
    return response.clone().json()
      .catch(function () {
        return response.text()
          .then(function (rawBody) {
            return { error: rawBody }
          })
      })
      .then(function (errorBody) {
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
