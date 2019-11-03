#! /usr/bin/env node
var fs = require('fs')
var jscodeshift = require('jscodeshift')
var glob = require('glob')
var touch = require('touch')
var PO = require('pofile')
var argv = require('minimist')(process.argv.slice(2))

var globPattern = argv._[0]
var outfiles = Array.isArray(argv.f) ? argv.f : [argv.f]

glob(globPattern, function (err, files) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  if (!files) {
    console.log('No files found using given pattern %s, exiting', globPattern)
    process.exit(0)
  }

  var allStrings = files
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
  Promise.all(allStrings)
    .then(function (strings) {
      return Promise.all(outfiles.map(function (outfile) {
        return merge(outfile, strings)
      }))
    })
    .then(function () {
      console.log('Successfully saved strings to %j', outfiles)
    })
    .catch(function (err) {
      console.error(err)
      process.exit(1)
    })
})

function merge (file, strings) {
  var currentPo = new PO()
  currentPo.items = [].concat.apply([], strings)
  return new Promise(function (resolve, reject) {
    PO.load(file, function (err, existingPo) {
      if (err) {
        if (err.code !== 'ENOENT') {
          return reject(err)
        }
      } else {
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
      touch(file, function (err) {
        if (err) {
          return reject(err)
        }
        currentPo.save(file, function (err) {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    })
  })
}
