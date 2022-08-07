/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = (state = null, action) => {
  switch (action.type) {
    case 'SET_EXTENSION_DATA':
      if (!state) {
        return action.payload
      }
      return { ...state, ...action.payload }
    default:
      return state
  }
}
