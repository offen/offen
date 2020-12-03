/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const classnames = require('classnames')

const Slides = require('./slides')

const UserOnboarding = (props) => {
  const { onComplete } = props
  return (
    <Fragment>
      <a
        class='pointer'
        role='button'
        onclick={onComplete}
      >
        {__('Skip')}
      </a>
      <Slides
        slides={[
          (props) => {
            const { onNext } = props
            return (
              <Fragment>
                <p>{__('Slide 1 content')}</p>
                <button onclick={onNext}>
                  {__('Next')}
                </button>
              </Fragment>
            )
          },
          (props) => {
            const { onNext } = props
            return (
              <Fragment>
                <p>{__('Slide 2 content')}</p>
                <button onclick={onNext}>
                  {__('Next')}
                </button>
              </Fragment>
            )
          },
          (props) => {
            return (
              <Fragment>
                <p>{__('Slide 3 content')}</p>
                <button onclick={onComplete}>
                  {__('Open Auditorium')}
                </button>
              </Fragment>
            )
          }
        ]}
        navigation={(props) => {
          const { onChange, activeItem, numItems } = props
          return (
            <ul>
              {Array.from({ length: numItems }).map(function (el, index) {
                return (
                  <li key={`slider-item-${index}`} onclick={() => onChange(index)}>
                    <a
                      class={classnames({
                        pointer: true,
                        b: index === activeItem
                      })}
                      role='button'
                    >
                      {index + 1}
                    </a>
                  </li>
                )
              })}
            </ul>
          )
        }}
      />
    </Fragment>
  )
}

module.exports = UserOnboarding
