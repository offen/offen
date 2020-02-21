module.exports = (state = null, action) => {
  switch (action.type) {
    case 'QUERY_SUCCESS':
    case 'PURGE_SUCCESS':
      return action.payload
    case 'NAVIGATE':
      return null
    default:
      return state
  }
}
