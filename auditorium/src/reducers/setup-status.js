module.exports = (state = null, action) => {
  switch (action.type) {
    case 'SETUP_STATUS_EMPTY':
      return 'empty'
    case 'SETUP_SUCCESS':
      return null
    default:
      return state
  }
}
