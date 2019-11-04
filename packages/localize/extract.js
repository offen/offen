var fs = require('fs')
var util = require('util')
var jscodeshift = require('jscodeshift')
var glob = require('glob')
var touch = require('touch')
var PO = require('pofile')

module.exports = extractStrings

function extractStrings (destination, globPattern) {
  return util.promisify(glob)(globPattern)
    .then(function (files) {
      if (!files || !files.length) {
        console.log('No files found using given pattern %s, exiting', globPattern)
        return null
      }
      return parse(files)
    })
    .then(function (allStrings) {
      return merge(destination, allStrings)
    })
    .then(function () {
      console.log('Successfully saved strings to %j', destination)
    })
}

function merge (file, allStrings) {
  var currentPo = new PO()
  currentPo.items = allStrings

  return util.promisify(PO.load)(file)
    .catch(function (err) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    })
    .then(function (existingPo) {
      if (existingPo) {
        currentPo.items = currentPo.items.map(function (item) {
          var exists = existingPo.items.filter(function (existingItem) {
            return existingItem.msgid === item.msgid
          })
          if (exists.length && exists[0].msgstr.length) {
            item.msgstr = exists[0].msgstr
          }
          return item
        })
      }
      return util.promisify(touch)(file)
    })
    .then(function () {
      return util.promisify(currentPo.save).bind(currentPo)(file)
    })
}

function parse (files) {
  var all = files
    .filter(function (fileName) {
      return !(/node_modules/.test(fileName))
    })
    .map(function (fileName) {
      return new Promise(function (resolve, reject) {
        fs.readFile(fileName, 'utf-8', function (err, data) {
          if (err) {
            return reject(err)
          }
          var j = jscodeshift(data)
          var calls = j.find(jscodeshift.CallExpression, {
            callee: {
              type: 'Identifier',
              name: '__'
            }
          })
          var strings = []
          calls.forEach(function (node) {
            var dupes = strings.filter(function (string) {
              return string.msgid === node.value.arguments[0].value
            })
            if (dupes.length) {
              dupes[0].comments.push(fileName + ':' + node.node.loc.start.line)
            } else {
              var item = new PO.Item()
              item.msgid = node.value.arguments[0].value
              item.comments = [
                fileName + ':' + node.node.loc.start.line
              ]
              strings.push(item)
            }
          })
          resolve(strings)
        })
      })
    })
  return Promise.all(all)
    .then(function (results) {
      return [].concat.apply([], results)
    })
}
