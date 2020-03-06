/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.expire = (flashId) => ({
  type: 'EXPIRE_FLASH',
  payload: { flashId }
})
