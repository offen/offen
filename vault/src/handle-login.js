var api = require('./api')

module.exports = handleLoginWith(getFromSessionStorage, setInSessionStorage)

function handleLoginWith (get, set) {
  return function (message) {
    var credentials = (message.payload && message.payload.credentials) || null

    return api.login(credentials)
      .then(function (response) {
        if (credentials) {
          return set(response)
        }
        return get()
          .then(function (storedResponse) {
            if (!storedResponse) {
              var noSessionErr = new Error('No local session found')
              noSessionErr.status = 401
              throw noSessionErr
            }
            if (response.userId !== storedResponse.userId) {
              var mismatchErr = new Error('Received user id did not match local session')
              mismatchErr.status = 401
              throw mismatchErr
            }
            return storedResponse
          })
      }).then(function (response) {
        return {
          type: 'LOGIN_SUCCESS',
          payload: response
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
          return {
            type: 'LOGIN_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}

function getFromSessionStorage () {
  try {
    var persisted = window.sessionStorage.getItem('session')
    return Promise.resolve(JSON.parse(persisted))
  } catch (err) {
    return Promise.reject(err)
  }
}

function setInSessionStorage (value) {
  try {
    var serialized = JSON.stringify(value)
    window.sessionStorage.setItem('session', serialized)
    return Promise.resolve(value)
  } catch (err) {
    return Promise.reject(err)
  }
}
