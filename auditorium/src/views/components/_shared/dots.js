/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useEffect, useState } = require('preact/hooks')

const Dots = (props) => {
  const { min = 1, max = 3, char = '.' } = props
  const [count, setCount] = useState(max)

  useEffect(function tick () {
    const ticker = window.setInterval(function () {
      const increment = count + 1
      if (increment <= max) {
        setCount(increment)
      } else {
        setCount(min)
      }
    }, 750)
    return function cancel () {
      window.clearInterval(ticker)
    }
  }, [count])

  let str = ''
  for (let i = 0; i < count; i++) {
    str += char
  }
  return (
    <span class='dib ml1'>{str}</span>
  )
}

module.exports = Dots
