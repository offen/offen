<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# packages

`packages` contains JavaScript modules shared across applications. Consumer should use the `file:` scheme to install the package like so:

```json
{
  "dependencies": {
    "offen": "file:./../packages"
  }
}
```
