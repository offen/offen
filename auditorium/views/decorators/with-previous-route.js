module.exports = withPreviousRoute

function withPreviousRoute () {
  return function (originalView) {
    return function (state, emit) {
      state.previousRoute = state.route
      state.previousParams = state.params
      return originalView(state, emit)
    }
  }
}
