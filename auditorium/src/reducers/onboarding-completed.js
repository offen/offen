/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = null, action) => {
  switch (action.type) {
    case 'ONBOARDING_STATUS_SUCCESS':
      return action.payload.status
    default:
      return state
  }
}
