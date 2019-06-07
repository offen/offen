var uuid = require('uuid/v4')
var vault = require('offen/vault')
var format = require('date-fns/format')
var addDays = require('date-fns/add_days')
var differenceInDays = require('date-fns/difference_in_days')
var get = require('lodash/get')

module.exports = store

function groupEvents (numDays, events) {
  var now = new Date()
  var dates = {}
  for (var i = 0; i < numDays; i++) {
    var date = addDays(now, -i)
    var formatted = format(date, 'DD.MM.YYYY')
    dates[formatted] = []
  }
  events.forEach(function (event) {
    var formatted = format(event.payload.timestamp, 'DD.MM.YYYY')
    if (dates[formatted]) {
      dates[formatted].push(event.payload)
    }
  })
  return dates
}

function getUnique (numDays /* , ...path */) {
  var path = [].slice.call(arguments, 1)
  path = path.join('.')
  return function (events) {
    var now = new Date()
    var elements = events
      .filter(function (event) {
        var distance = differenceInDays(now, event.payload.timestamp)
        return distance < numDays
      })
      .reduce(function (acc, event) {
        var value = get(event, path)
        if (value) {
          acc[value] = true
        }
        return acc
      }, {})
    return Object.keys(elements).length
  }
}

function store (state, emitter) {
  emitter.on('offen:query', function (data) {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'QUERY',
          respondWith: uuid(),
          payload: data
            ? { query: data }
            : null
        }
        return postMessage(queryRequest)
      })
      .then(function (message) {
        var result = message.payload.result
        var numDays = parseInt(state.query.num_days, 10) || 7
        state.model = {
          eventsByDate: groupEvents(numDays, result),
          uniqueSessions: getUnique(numDays, 'payload', 'sessionId')(result),
          uniqueUsers: getUnique(numDays, 'user_id')(result)
        }
      })
      .catch(function (err) {
        console.error(err)
        state.model.error = err
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })
}

store.storeName = 'data'
