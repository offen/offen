/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = null, action) => {
  switch (action.type) {
    case 'SETUP_STATUS_EMPTY':
      return 'empty'
    case 'SETUP_SUCCESS':
      return null
    default:
      return state
  }
}
