---
layout: default
title: Embedding the Offen script
nav_order: 7
description: "How to add the Offen script to your webpage."
permalink: /running-offen/embedding-the-script/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Embedding the Offen script

Each page that is expected to be included in the usages statistics requires to load the Offen script. The script needs to be configured with the Account ID you want to use for that page.

The script is served from `https://<your-installation-domain>/script.js` and can be included in any portion of your document, for example as portion of the document's `<head>`:

```html
<script async src="https://<your-installation-domain>/script.js" data-account-id="<your-account-id>"></script>
```

Your Account ID and the entire snippet can be found when you log in to the Auditorium and select the account you want use.
