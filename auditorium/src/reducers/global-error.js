module.exports = (state = null, action) => {
  switch (action.type) {
    case 'UNRECOVERABLE_ERROR':
      return action.payload
    default:
      return state
  }
}
