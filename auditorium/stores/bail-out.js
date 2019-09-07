module.exports = store

function store (state, emitter) {
  emitter.on('offen:bailOut', function (message) {
    process.nextTick(function () {
      state.error = {
        message: message
      }
      emitter.emit(state.events.RENDER)
    })
  })
  emitter.on('offen:flash', function (message) {
    state.flash = message
    emitter.emit(state.events.RENDER)
  })
}
