/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
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
  const {
    rows: originalRows,
    formatAs = ['count'],
    onEmptyMessage = __('No data available for this view.'),
    limit = 10,
    showAll = false,
    ItemDecorator,
    setShowAll = Function.prototype,
    emptyFallback,
    titleTransform = x => x
  } = props

  let rows = [...(originalRows || [])]
  const isFallback = emptyFallback && rows.length === 0

  if (isFallback) {
    rows = [emptyFallback]
  }
  const hasMore = Array.isArray(rows) && rows.length > limit

  const tBody = Array.isArray(rows) && rows.length
    ? rows.slice(0, showAll ? rows.length : limit).map(function (row, index) {
      const counts = Array.isArray(row.count) ? row.count : [row.count]
      return (
        <tr key={`outer-${index}`} class='striped--near-white'>
          <td class='truncate pv2 pl2 pr1' title={titleTransform(row.key)}>
            {ItemDecorator
              ? <ItemDecorator isFallback={isFallback}>{row.key}</ItemDecorator>
              : row.key}
          </td>
          {counts.map((count, index) => {
            return (
              <td class='pv2 ph1' key={`inner-${index}`}>
                <Format formatAs={formatAs[index]}>
                  {count}
                </Format>
              </td>
            )
          })}
        </tr>
      )
    })
    : (
      <tr>
        <td class='f6 mid-gray i pl2' colspan='2'>
          {onEmptyMessage}
        </td>
      </tr>
    )

  const [keyName, ...valueNames] = props.columnNames
  return (
    <Fragment>
      <table class='collapse w-100 dt--fixed-ns'>
        <thead>
          <tr>
            <th class='f6 normal tl pv2 pl2 pr1 mid-gray'>
              {keyName}
            </th>
            {valueNames.map((name, index) => {
              return (
                <th
                  class='w-25 f6 normal tl pv2 ph1 mid-gray'
                  key={`value-name-${index}`}
                >
                  {name}
                </th>
              )
            })}
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
            <div
              class='bt b--light-gray pt3 mb2'
            >
              <a
                data-role='button'
                class='b normal link dim dark-green pointer'
                onclick={() => setShowAll(false)}
              >
                {__('Show top %d only', limit)}
              </a>
            </div>
          )
        }
        return (
          <div
            class='bt b--light-gray pt3 mb2'
          >
            <a
              data-role='button'
              class='b normal link dim dark-green pointer'
              onclick={() => setShowAll(true)}
            >
              {__('Show all entries')}
            </a>
          </div>
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

    const isFallback = set.props.emptyFallback &&
      (!set.props.rows || (Array.isArray(set.props.rows) && set.props.rows.length === 0))
    var css = []
    if (tableSets.length === 1) {
      css.push('f5', 'b', 'normal', 'dib', 'pt2', 'pb2', 'ph2')
      css.push(isFallback ? 'dark-red' : 'dark-green')
    }
    if (tableSets.length > 1) {
      css.push('f5', 'b', 'normal', 'link', 'dim', 'dib', 'pt2', 'pb2', 'ph2', 'mr0', 'mr2-ns')
      css.push(isFallback ? 'dark-red' : 'dark-green')
    }

    let handleClick = null
    const ariaLabels = {}
    if (tableSets.length > 1) {
      css.push('pointer')
      handleClick = () => setSelectedTab(index)
    }
    if (index === selectedTab && tableSets.length !== 1) {
      css.push('bt', 'bw2')
      css.push(isFallback ? 'b--dark-red' : 'b--dark-green')
      ariaLabels['aria-current'] = 'true'
    }

    let explainerProps = {}
    if (showExplainer && explainerPropsFor) {
      explainerProps = explainerPropsFor(`table/${groupName}/${set.props.headline}`)
    }

    if (explainerProps.explainerActive) {
      css.push('bg-light-yellow')
    }

    return (
      <a
        tabindex='0'
        key={index}
        role='button'
        class={classnames(css)}
        onclick={handleClick}
        onkeypress={(e) => {
          if (e.which === 13) {
            handleClick()
          }
        }}
        {...ariaLabels}
      >
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
