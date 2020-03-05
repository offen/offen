const flash = require('./../action-creators/flash')

module.exports = (store) => (next) => (action) => {
  if (action.payload && action.payload.flash) {
    const id = Math.random().toString(36).slice(2)
    action.payload.flashId = id
    setTimeout(() => {
      store.dispatch(flash.expire(id))
    }, 10000)
  }
  next(action)
}
