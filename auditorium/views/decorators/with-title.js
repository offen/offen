module.exports = withTitle

function withTitle (originalView, title) {
  withTitle.unwrap = function () {
    return originalView
  }
  return function (state, emit) {
    if (state.title !== title) {
      emit(state.events.DOMTITLECHANGE, title)
    }
    return originalView(state, emit)
  }
}
