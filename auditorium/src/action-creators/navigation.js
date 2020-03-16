/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.navigate = (url) => ({
  type: 'NAVIGATE',
  payload: { url }
})
