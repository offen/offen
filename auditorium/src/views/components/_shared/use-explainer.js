/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const { useState } = require('preact/hooks')

module.exports = useExplainer

function useExplainer () {
  const [activeExplainer, setActiveExplainer] = useState(null)
  return function explainerPropsFor (key) {
    return {
      showExplainer: true,
      activeExplainer: activeExplainer,
      explainerActive: activeExplainer === key,
      onExplain: (e) => {
        if (e) {
          e.stopPropagation()
        }
        setActiveExplainer(activeExplainer !== key ? key : null)
      },
      explainerPropsFor: explainerPropsFor
    }
  }
}
