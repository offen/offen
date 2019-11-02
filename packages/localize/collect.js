#! /usr/bin/env node
var fs = require('fs')
var jscodeshift = require('jscodeshift')

var file = process.argv[2]

fs.readFile(file, 'utf-8', function (err, data) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  var j = jscodeshift(data)
  var calls = j.find(jscodeshift.CallExpression, {
    callee: {
      type: 'Identifier',
      name: '__'
    }
  })
  var containedStrings = []
  calls.forEach(function (node) {
    containedStrings.push(node.value.arguments[0].value)
  })
  console.log(containedStrings)
})
