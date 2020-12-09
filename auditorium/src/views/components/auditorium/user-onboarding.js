/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

const Slides = require('./slides')
const ExplainerIcon = require('./explainer-icon')

const UserOnboarding = (props) => {
  const { onComplete, stats } = props
  return (
    <div class='flex flex-column flex-row-l mt4-m mt4-l' data-testid='auditorium/onboarding-wrapper'>
      <div class='w-100 flex bt bb ba-ns b--black-10 br0 br2-ns mb2-ns'>
        <div class='pa3 pa4-m pa5-l bg-white w-100'>
          <div class='cf mb0 mb4-m mb5-l'>
            <a
              class='fr f5 b normal link dim dib dark-green pointer'
              role='button'
              onclick={onComplete}
            >
              {__('Skip')}
            </a>
          </div>
          <div>
            <Slides
              slides={[
                (props) => {
                  const { onNext } = props
                  return (
                    <Fragment>
                      <Wrapper>
                        <Illustration
                          src='/offen-onboarding-1.svg'
                          alt='Onboarding illustration 1'
                        />
                        <Content>
                          <p class='ma0 mb3'>
                            {__('Welcome to the Auditorium, this is how it works.')}
                          </p>
                          <p class='f3 ma0 mb3'>
                            {__('What %s knows about you.', stats.domain)}
                          </p>
                          <p class='ma0'>
                            {__('You just visited the page %s.', stats.url)}&nbsp;
                            {__('It is probably your %dth time on %s.', stats.numVisits, stats.domain)}&nbsp;
                            {stats.referrer
                              ? (
                                <Fragment>
                                  {__('You came via %s.', stats.referrer)}&nbsp;
                                </Fragment>
                              )
                              : null}
                            {__('Most likely your are on a %s device.', stats.isMobile ? __('mobile') : __('desktop'))}
                          </p>
                        </Content>
                      </Wrapper>
                      <Button
                        onClick={onNext}
                        class='w-100 w-20-ns f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'
                      >
                        {__('Next')}
                      </Button>
                    </Fragment>
                  )
                },
                (props) => {
                  const { onNext } = props
                  return (
                    <Fragment>
                      <Wrapper>
                        <Illustration
                          src='/offen-onboarding-2.svg'
                          alt='Onboarding illustration 2'
                        />
                        <Content>
                          <p class='f3 ma0 mb3'>
                            {__('Your data always stays yours.')}
                          </p>
                          <p class='ma0 mb3'>
                            {__('Review your data in the Auditorium. You can delete your data or opt out completly at any time in the Privacy tab.')}
                          </p>
                          <ExplainerIcon />
                          <p class='di ma0 ml2'>
                            {__('Click this symbol to display detailed explanations of the respective terms.')}
                          </p>
                        </Content>
                      </Wrapper>
                      <Button
                        onClick={onNext}
                        class='w-100 w-20-ns f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'
                      >
                        {__('Next')}
                      </Button>
                    </Fragment>
                  )
                },
                (props) => {
                  return (
                    <Fragment>
                      <Wrapper>
                        <Illustration
                          src='/offen-onboarding-3.svg'
                          alt='Onboarding illustration 3'
                        />
                        <Content>
                          <p class='f3 ma0 mb3'>
                            {__('Bookmark this page to come back later.')}
                          </p>
                          <p class='ma0 mb1'>
                            {__('Get an overall picture of your data collected over time. Come back here anytime to see what coolblog.com knows about you.')}
                          </p>
                          <p class='ma0'>
                            {__("Now let's get started!")}
                          </p>
                        </Content>
                      </Wrapper>
                      <Button
                        onClick={onComplete}
                        class='w-100 w-30-m w-20-l f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'
                      >
                        {__('Open Auditorium')}
                      </Button>
                    </Fragment>
                  )
                }
              ]}
              navigation={Navigation}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

module.exports = UserOnboarding

function Navigation (props) {
  const { onChange, activeItem, numItems } = props
  return (
    <div class='flex justify-center'>
      <ul class='flex justify-center list pa0 ma0'>
        {Array.from({ length: numItems }).map(function (el, index) {
          return (
            <li key={`slider-item-${index}`} onclick={() => onChange(index)}>
              <a class='pointer mh2' role='button'>
                <Dot active={activeItem === index} />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Dot (props) {
  const { active } = props
  return (
    <svg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'>
      <circle cx='4' cy='4' r='4' fill={active ? '#555' : '#CCC'} />
    </svg>
  )
}

function Illustration (props) {
  const { src, alt } = props
  return (
    <div class='w-100 w-25-ns mr0 mr4-m mr5-l mt4 mt0-ns'>
      <img src={src} alt={alt} width='180' height='190' class='onboarding-image-height db center' />
    </div>
  )
}

function Content (props) {
  return (
    <div class='w-100 w-75-ns mt3 mt0-ns'>
      <div class='w-100 w-80-l lh-copy mt3-m mt4-l'>
        {props.children}
      </div>
    </div>
  )
}

function Wrapper (props) {
  return (
    <div class='flex flex-column flex-row-ns items-start justify-center-ns onboarding-height'>
      {props.children}
    </div>
  )
}

function Button (props) {
  return (
    <div class='flex justify-center mb4'>
      <button
        onClick={props.onClick}
        class={props.class || 'w-100 w-20-ns f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'}
        data-testid='auditorium/onboarding-advance'
      >
        {props.children}
      </button>
    </div>
  )
}
