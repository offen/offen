/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')
const classnames = require('classnames')
const countries = require('i18n-iso-countries')

const Tables = require('./tables')
const ExplainerIcon = require('./explainer-icon')
const Paragraph = require('./../_shared/paragraph')
const ForwardingAnchor = require('./../_shared/forwarding-anchor')

const FilterIcon = (props) => {
  const { isFallback } = props
  return (
    <div class='margin-filterIcon mr2'>
      <svg class='dib' width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M15.9317 0.49858C16.0603 0.848011 16.0073 1.14631 15.7728 1.39347L10.1787 7.69602V17.1818C10.1787 17.5398 10.0311 17.7912 9.73612 17.9361C9.63778 17.9787 9.54322 18 9.45244 18C9.24819 18 9.07798 17.919 8.94182 17.7571L6.03694 14.4844C5.89321 14.3224 5.82134 14.1307 5.82134 13.9091V7.69602L0.22718 1.39347C-0.00732838 1.14631 -0.0602819 0.848011 0.0683195 0.49858C0.196921 0.166193 0.420082 0 0.737803 0H15.2622C15.5799 0 15.8031 0.166193 15.9317 0.49858Z' fill={isFallback ? '#e7040f' : '#137752'} />
      </svg>
    </div>
  )
}

const FilterLink = (props) => {
  const { filterProp, filterValue, children: linkContent, isFallback, filter } = props
  const value = `${filterProp}:${filterValue || linkContent}`
  if (value === filter) {
    const color = isFallback ? 'bg-dark-red' : 'bg-dark-green'
    return (
      <ForwardingAnchor
        skip={['filter']}
        class={`flex flex-nowrap-ns flex-wrap w-100 no-underline link dim dib br1 ph2 pv2 nt2 nb2 nl2 white ${color}`}
        title={__('Remove this filter.')}
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
      </ForwardingAnchor>
    )
  }

  return (
    <ForwardingAnchor
      class='link dim dark-green'
      title={__('Filter current view by this item.')}
      values={{ filter: window.encodeURIComponent(value) }}
    >
      {linkContent}
    </ForwardingAnchor>
  )
}

const URLTable = (props) => {
  const {
    model, showExplainer, explainerActive,
    onExplain, explainerPropsFor, queryParams
  } = props

  const [showAll, setShowAll] = useState(null)

  let currentFilterProp = null
  let currentFilterValue = null
  if (model.filter) {
    const tokens = model.filter.split(':')
    currentFilterProp = tokens.shift()
    currentFilterValue = tokens.join(':')
  }

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
              {__('This panel displays several page lists that count the total number of your page views of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation</a> per URL in different categories.', 'b link dim dark-green')}
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
                queryParams={queryParams}
                filter={model.filter}
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={currentFilterProp === 'href' && { key: currentFilterValue, count: 0 }}
            showAll={showAll === 0}
            setShowAll={(open) => setShowAll(open ? 0 : null)}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='geo-location'
        >
          <Tables.Table
            headline={__('Location')}
            columnNames={[__('Country'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.geo}
            titleTransform={k => countries.getName(k, process.env.LOCALE, { select: 'alias' })}
            ItemDecorator={(props) => {
              let content
              if (props.children === '__NONE_GEOLOCATION__') {
                content = (<i>{__('None')}</i>)
              } else {
                content = countries.getName(
                  props.children,
                  process.env.LOCALE,
                  { select: 'alias' }
                ) || props.children
              }

              return (
                <FilterLink
                  {...props}
                  filterProp='geo'
                  filterValue={props.children}
                  queryParams={queryParams}
                  filter={model.filter}
                >
                  {content}
                </FilterLink>
              )
            }}
            emptyFallback={currentFilterProp === 'geo' && { key: currentFilterValue, count: [0, 0] }}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('The geographic location associated with each session.')}
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
          groupName='referrers'
        >
          <Tables.Table
            headline={(props) => currentFilterProp === 'referrer'
              ? <Fragment><FilterIcon {...props} />{__('Referrers')}</Fragment>
              : __('Referrers')}
            columnNames={[__('Host'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.referrers}
            titleTransform={k => k === '__NONE_REFERRER__' ? __('None') : k}
            ItemDecorator={(props) => {
              let content = props.children
              if (content === '__NONE_REFERRER__') {
                content = (<i>{__('None')}</i>)
              }
              return (
                <FilterLink
                  {...props}
                  filterProp='referrer'
                  filterValue={props.children}
                  queryParams={queryParams}
                  filter={model.filter}
                >
                  {content}
                </FilterLink>
              )
            }}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation.</a> Popular referrers like, for example, Google or Twitter display their proper name, others their domain.', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 2}
            setShowAll={(open) => setShowAll(open ? 2 : null)}
            emptyFallback={currentFilterProp === 'referrer' && { key: currentFilterValue, count: [0, 0] }}
          />
          <Tables.Table
            headline={(props) => currentFilterProp === 'campaign'
              ? <Fragment><FilterIcon {...props} />{__('Campaigns')}</Fragment>
              : __('Campaigns')}
            columnNames={[__('Campaign'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.campaigns}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='campaign'
                queryParams={queryParams}
                filter={model.filter}
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={currentFilterProp === 'campaign' && { key: currentFilterValue, count: [0, 0] }}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a campaign tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 2}
            setShowAll={(open) => setShowAll(open ? 2 : null)}
          />
          <Tables.Table
            headline={(props) => currentFilterProp === 'source'
              ? <Fragment><FilterIcon {...props} />{__('Sources')}</Fragment>
              : __('Sources')}
            columnNames={[__('Source'), __('Sessions'), __('Page depth')]}
            formatAs={['count', 'value']}
            rows={model.sources}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='source'
                queryParams={queryParams}
                filter={model.filter}
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={currentFilterProp === 'source' && { key: currentFilterValue, count: [0, 0] }}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of special referrers that directed you to pages of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation.</a> <a href="#terms-operator" class="%s">Operators</a> can mark links to their pages with a source tag. This is used, for example, to measure the success of online advertising campaigns.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 2}
            setShowAll={(open) => setShowAll(open ? 2 : null)}
          />
        </Tables.Container>
        <Tables.Container
          showExplainer={showExplainer}
          explainerPropsFor={explainerPropsFor}
          groupName='landing-exit'
        >
          <Tables.Table
            headline={(props) => currentFilterProp === 'landing'
              ? <Fragment><FilterIcon {...props} />{__('Landing pages')}</Fragment>
              : __('Landing pages')}
            columnNames={[__('URL'), __('Landings')]}
            rows={model.landingPages}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='landing'
                queryParams={queryParams}
                filter={model.filter}
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={currentFilterProp === 'landing' && { key: currentFilterValue, count: [0, 0] }}
            explainer={(props) => (
              <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation</a> that you have opened first in all <a href="#terms-unique-session" class="%s">unique sessions.</a>', 'b link dim dark-green', 'b link dim dark-green')}
              </Paragraph>
            )}
            showAll={showAll === 3}
            setShowAll={(open) => setShowAll(open ? 3 : null)}
          />
          <Tables.Table
            headline={(props) => currentFilterProp === 'exit'
              ? <Fragment><FilterIcon {...props} />{__('Exit pages')}</Fragment>
              : __('Exit pages')}
            columnNames={[__('URL'), __('Exits')]}
            rows={model.exitPages}
            ItemDecorator={(props) => (
              <FilterLink
                {...props}
                filterProp='exit'
                queryParams={queryParams}
                filter={model.filter}
              >
                {props.children}
              </FilterLink>
            )}
            emptyFallback={currentFilterProp === 'exit' && { key: currentFilterValue, count: [0, 0] }}
            explainer={(props) => {
              return (
                <Paragraph class='mw7 ma0 ph1 pv2 ws-normal'>
                  {__('A list of pages of the <a href="#terms-offen-installation" class="%s">Offen Fair Web Analytics installation</a> that you have opened last in all <a href="#terms-unique-session" class="%s">unique sessions.</a> For this to be counted you must have visited at least two pages.', 'b link dim dark-green', 'b link dim dark-green')}
                </Paragraph>
              )
            }}
            showAll={showAll === 3}
            setShowAll={(open) => setShowAll(open ? 3 : null)}
          />
        </Tables.Container>
      </div>
    </div>
  )
}

module.exports = URLTable
