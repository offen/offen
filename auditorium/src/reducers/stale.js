module.exports = (state = false, action) => {
  switch (action.type) {
    case 'QUERY_REQUEST':
      return true
    case 'QUERY_SUCCESS':
    case 'QUERY_FAILURE':
    case 'NAVIGATE':
      return false
    default:
      return state
  }
}
