/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = {}, action) => {
  switch (action.type) {
    case 'UDPATE_QUERY_PARAMS':
      return action.payload
    default:
      return state
  }
}
