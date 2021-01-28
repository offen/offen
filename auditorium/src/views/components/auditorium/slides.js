/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const Slides = (props) => {
  const [index, setIndex] = useState(0)
  const { slides, navigation } = props
  const current = slides[index]({
    onNext: () => setIndex(index + 1)
  })
  const nav = navigation
    ? navigation({
        onChange: (idx) => setIndex(idx),
        activeItem: index,
        numItems: slides.length
      })
    : null
  return (
    <Fragment>
      {current}
      {nav}
    </Fragment>
  )
}

module.exports = Slides
