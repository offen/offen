/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const KeyMetric = require('./key-metric')
const Tables = require('./tables')

const Live = (props) => {
  const { model } = props
  return (
    <div class='flex-auto b--black-10 pa3 bg-white'>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 w-30-ns bn br-ns b--light-gray pr2 mr4'>
          <h4 class='f4 normal ma0 mb4'>
            {__('Real time')}
          </h4>
          <KeyMetric
            value={model.liveUsers}
            name={__('Active users on site')}
            formatAs='count'
          />
        </div>
        <div class='w-100 w-70-ns bt bn-ns b--light-gray mt1'>
          <h3 class='f5 normal pv3 mv0'>
            {__('Active pages')}
          </h3>
          <Tables.Container
            removeBorder
          >
            <Tables.Table
              limit={5}
              columnNames={[__('URL'), __('Visitors')]}
              rows={model.livePages}
            />
          </Tables.Container>
        </div>
      </div>
    </div>
  )
}

module.exports = Live
