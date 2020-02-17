exports.navigate = (url, persistFlash) => ({
  type: 'NAVIGATE',
  payload: { url, persistFlash }
})
