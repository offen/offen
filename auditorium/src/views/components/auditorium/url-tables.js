/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const classnames = require('classnames')

const Tables = require('./tables')
const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')

const URLTable = (props) => {
  const {
    model, showExplainer, explainerActive,
    onExplain, explainerPropsFor, queryParams
  } = props

  let currentFilterProp = null
  let currentFilterValue = null
  if (model.filter) {
    const tokens = model.filter.split(':')
    currentFilterProp = tokens.shift()
    currentFilterValue = tokens.join(':')
  }

  const FilterLink = (props) => {
    let href = window.location.pathname
    const { filterProp, children: linkContent, isFallback } = props
    const search = new window.URLSearchParams(queryParams)
    const value = `${filterProp}:${linkContent}`

    if (value === model.filter) {
      search.delete('filter')
      if (search.toString()) {
        href += '?' + search
      }
      const color = isFallback ? 'bg-dark-red' : 'bg-dark-green'
      return (
        <a
          class={`flex flex-nowrap-ns flex-wrap w-100 no-underline link dim dib br1 ph2 pv2 nt2 nb2 nl2 white ${color}`}
          title={__('Remove this filter.')}
          href={href}
        >
          <div
            class='order-1-ns order-2 lh-solid mt0-ns mt2'
          >
            <svg class='db' width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M15.9317 0.49858C16.0603 0.848011 16.0073 1.14631 15.7728 1.39347L10.1787 7.69602V17.1818C10.1787 17.5398 10.0311 17.7912 9.73612 17.9361C9.63778 17.9787 9.54322 18 9.45244 18C9.24819 18 9.07798 17.919 8.94182 17.7571L6.03694 14.4844C5.89321 14.3224 5.82134 14.1307 5.82134 13.9091V7.69602L0.22718 1.39347C-0.00732838 1.14631 -0.0602819 0.848011 0.0683195 0.49858C0.196921 0.166193 0.420082 0 0.737803 0H15.2622C15.5799 0 15.8031 0.166193 15.9317 0.49858Z' fill='white' />
            </svg>
          </div>
          <div
            class='order-2-ns order-1 w-100 truncate ml2-ns ml0'
          >
            {linkContent}
          </div>
          <div
            class='order-3 mt0-ns mt2 ml2 ml0-ns'
          >
            <div
              class='filter-close-icon'
            />
          </div>
        </a>
      )
    }

    search.set('filter', window.encodeURIComponent(value))
    href += '?' + search
    return (
      <a
        class='link dim dark-green'
        title={__('Filter current view by this item.')}
        href={href}
      >
        {linkContent}
      </a>
    )
  }

  const [showAll, setShowAll] = useState(null)
  return (
    <div class='flex-auto pa3 bg-white'>
      <div
        class={classnames('pa2', 'ma-1', explainerActive ? 'bg-light-yellow' : null)}
      >
        <h4 class='f4 normal ma0'>
          {__('Top pages')}
          {showExplainer ? <ExplainerIcon invert={explainerActive} marginLeft onclick={onExplain} /> : null}
        </h4>
        {explainerActive
          ? (
            <Paragraph class='mw7 ma0 pv2'>
              {__('This panel displays several page lists that count the total number of your page views of the <a href="#terms-offen-installation" class="%s">Offen installation</a> per URL in different categories.', 'b link dim dark-green')}
            </Paragraph>
          )
          : null}
      </div>
      <div class='mt3'>
        <Tables.Container>
          <Tables.Table
            columnNames={[__('URL'), __('Pageviews')]}
            rows={model.pages}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='href'
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={
              currentFilterProp === 'href'
                ? { key: currentFilterValue, count: 0 }
                : null
            }
            showAll={showAll === 0}
            setShowAll={(open) => setShowAll(open ? 0 : null)}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='referrers'
        >
          <Tables.Table
            headline={__('Referrers')}
            columnNames={[__('Host'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.referrers}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='referrer'
              >
                {props.children}
              </FilterLink>
            )}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> Popular referrers like, for example, Google or Twitter display their proper name, others their domain.', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 1}
            setShowAll={(open) => setShowAll(open ? 1 : null)}
            emptyFallback={
              currentFilterProp === 'referrer'
                ? { key: currentFilterValue, count: [0, 0] }
                : null
            }
          />
          <Tables.Table
            headline={__('Campaigns')}
            columnNames={[__('Campaign'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.campaigns}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='campaign'
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={
              currentFilterProp === 'campaign'
                ? { key: currentFilterValue, count: [0, 0] }
                : null
            }
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a campaign tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 1}
            setShowAll={(open) => setShowAll(open ? 1 : null)}
          />
          <Tables.Table
            headline={__('Sources')}
            columnNames={[__('Source'), __('Sessions'), __('Views per session')]}
            formatAs={['count', 'value']}
            rows={model.sources}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='source'
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={
              currentFilterProp === 'source'
                ? { key: currentFilterValue, count: [0, 0] }
                : null
            }
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a source tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 1}
            setShowAll={(open) => setShowAll(open ? 1 : null)}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='landing-exit'
        >
          <Tables.Table
            headline={__('Landing pages')}
            columnNames={[__('URL'), __('Landings')]}
            rows={model.landingPages}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='landing'
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={
              currentFilterProp === 'landing'
                ? { key: currentFilterValue, count: 0 }
                : null
            }
            explainer={(props) => (
              <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened first in all <a href="#terms-unique-session" class="%s">unique sessions.</a>', 'b link dim dark-green', 'b link dim dark-green')}
              </Paragraph>
            )}
            showAll={showAll === 2}
            setShowAll={(open) => setShowAll(open ? 2 : null)}
          />
          <Tables.Table
            headline={__('Exit pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='exit'
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={
              currentFilterProp === 'exit'
                ? { key: currentFilterValue, count: 0 }
                : null
            }
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen installation</a> that you have opened last in all <a href="#terms-unique-session" class="%s">unique sessions.</a> For this to be counted you must have visited at least two pages.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 2}
            setShowAll={(open) => setShowAll(open ? 2 : null)}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
