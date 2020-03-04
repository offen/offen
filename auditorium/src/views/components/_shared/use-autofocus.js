const { useRef, useEffect } = require('preact/hooks')

const useAutofocus = () => {
  const autofocus = useRef(null)
  useEffect(() => {
    if (autofocus.current) {
      autofocus.current.focus()
    }
  }, [autofocus])
  return autofocus
}

module.exports = useAutofocus
