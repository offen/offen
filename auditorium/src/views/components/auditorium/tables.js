/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState, useEffect } = require('preact/hooks')
const classnames = require('classnames')

const Format = require('./format')
const ExplainerIcon = require('./explainer-icon')

const ExplainerContent = (props) => {
  const { explainerActive, children } = props
  if (!explainerActive) {
    return null
  }
  return (
    <div class='bg-light-yellow w-100 pa1'>
      {children}
    </div>
  )
}

const Table = (props) => {
  const { rows, onEmptyMessage = __('No data available for this view.'), limit = 10, formatAs = 'count' } = props
  const [showAll, setShowAll] = useState(false)

  const hasMore = Array.isArray(rows) && rows.length > limit

  var tBody = Array.isArray(rows) && rows.length
    ? rows.slice(0, showAll ? rows.length : limit).map(function (row, index) {
      return (
        <tr key={index} class='striped--near-white'>
          <td class='truncate pv2 pl2 pr1'>
            {row.key}
          </td>
          <td class='pv2 ph1'>
            <Format formatAs={formatAs}>
              {row.count}
            </Format>
          </td>
        </tr>
      )
    })
    : (
      <tr>
        <td class='pl2 moon-gray' colspan='2'>
          {onEmptyMessage}
        </td>
      </tr>
    )

  return (
    <Fragment>
      <table class='collapse dt--fixed mb2'>
        <thead>
          <tr>
            <th class='w-75 normal tl pv2 pl2 pr1 moon-gray'>
              {props.columnNames[0]}
            </th>
            <th class='w-25 normal tl pv2 ph1 moon-gray'>
              {props.columnNames[1]}
            </th>
          </tr>
        </thead>
        <tbody>
          {tBody}
        </tbody>
      </table>
      {(() => {
        if (!hasMore) {
          return null
        }
        if (showAll) {
          return (
            <a
              data-role='button'
              class='normal link dim dark-green pointer'
              onclick={() => setShowAll(false)}
            >
              {__('Show top %d only', limit)}
            </a>
          )
        }
        return (
          <a
            data-role='button'
            class='normal link dim dark-green pointer'
            onclick={() => setShowAll(true)}
          >
            {__('Show all entries')}
          </a>
        )
      })()}
    </Fragment>
  )
}

exports.Table = Table

const Container = (props) => {
  const { removeBorder, children, showExplainer, explainerPropsFor, groupName } = props
  const [selectedTab, setSelectedTab] = useState(0)
  const tableSets = Array.isArray(children)
    ? children
    : [children]

  if (explainerPropsFor) {
    useEffect(function unsetExplainerOnTab () {
      const { activeExplainer, onExplain } = explainerPropsFor(null)
      if (activeExplainer && activeExplainer.indexOf(`table/${groupName}/`) === 0) {
        onExplain()
      }
    }, [selectedTab, groupName])
  }

  const headlines = tableSets.map(function (set, index) {
    if (!set.props.headline) {
      return null
    }
    var css = []
    if (tableSets.length === 1) {
      css.push('f5', 'normal', 'dib', 'pv3')
    }
    if (tableSets.length > 1) {
      css.push('f5', 'normal', 'link', 'dim', 'dib', 'pt2', 'pb2', 'ph2', 'mr2', 'dark-green')
    }

    let handleClick = null
    if (tableSets.length > 1) {
      css.push('pointer')
      handleClick = () => setSelectedTab(index)
    }
    if (index === selectedTab && tableSets.length !== 1) {
      css.push('b', 'bt', 'bw2', 'b--dark-green')
    }

    let explainerProps = {}
    if (showExplainer && explainerPropsFor) {
      explainerProps = explainerPropsFor(`table/${groupName}/${set.props.headline}`)
    }

    if (explainerProps.explainerActive) {
      css.push('bg-light-yellow')
    }

    return (
      <a key={index} role='button' class={classnames(css)} onclick={handleClick}>
        {set.props.headline}
        {showExplainer && (index === selectedTab)
          ? (
            <ExplainerIcon
              onclick={explainerProps.onExplain}
              invert={explainerProps.explainerActive}
              marginLeft
            />
          )
          : null}
      </a>
    )
  })
    .filter(Boolean)

  var wrapperClass = ['nowrap', 'overflow-x-auto', 'overflow-y-hidden', 'mb4']
  if (!removeBorder) {
    wrapperClass.push('bt', 'b--light-gray')
  }

  return (
    <div>
      <div class={classnames(wrapperClass)}>
        {headlines.length
          ? (<div>{headlines}</div>)
          : null}
        {(() => {
          if (!explainerPropsFor || !showExplainer || !tableSets[selectedTab].props.explainer) {
            return null
          }
          const props = explainerPropsFor(`table/${groupName}/${tableSets[selectedTab].props.headline}`)
          return (
            <ExplainerContent {...props}>
              {tableSets[selectedTab].props.explainer({})}
            </ExplainerContent>
          )
        })()}
        {tableSets[selectedTab]}
      </div>
    </div>
  )
}

exports.Container = Container
