module.exports = withTitle

function withTitle (title) {
  return function (originalView) {
    return function (state, emit) {
      if (state.title !== title) {
        emit(state.events.DOMTITLECHANGE, title)
      }
      return originalView(state, emit)
    }
  }
}
