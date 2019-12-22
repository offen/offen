var html = require('choo/html')
var Component = require('choo/component')

module.exports = Input

function Input (id, state, emit, props) {
  Component.call(this)
  this.props = props || {}
}

Input.prototype = Object.create(Component.prototype)

Input.prototype.update = function (update) {
  return false
}

Input.prototype.createElement = function (tableSets) {
  var props = Object.assign({
    class: 'w-100 pa2 mb3 input-reset ba b--black-10 bg-white',
    type: 'text'
  }, this.props)
  return html`<input ${props}>`
}
