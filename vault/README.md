# vault

The `vault` is a small client side application that is supposed to be used by other applications (e.g. the `script` or the `auditorium`) by injecting an invisible `iframe` and then requesting or sending information using `window.postMessage`.

The `vault` is responsible for ensuring both cookies and cryptographic keys are protected by the same origin policy. It should never leak user identifiers or encryption keys to any application that embeds it. When responding to messages, it needs to make sure its messages can only be read by trusted sources so it cannot be tricked into responding to messages from malicious sources.

---

The app builds into a single HTML file with inlined JavaScript that is supposed to be loaded in an `<iframe>` element.
