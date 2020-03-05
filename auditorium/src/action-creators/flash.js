exports.expire = (flashId) => ({
  type: 'EXPIRE_FLASH',
  payload: { flashId }
})
