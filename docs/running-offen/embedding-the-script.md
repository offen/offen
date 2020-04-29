---
layout: default
title: Embedding the Offen script
nav_order: 6
description: "How to add the Offen script to your webpage."
permalink: /running-offen/embedding-the-script/
parent: Running Offen
---

# Embedding the Offen script

Each page that is expected to be included in the statistics requires to load the Offen script. The script needs to be configured with the Account Id you want to use for that page.

The script is served from `https://<your-installations-domain>/script.js` and can be included in any portion of your document, for example as portion of the document's `<head>`:

```html
<script src="https://<your-installations-domain>/script.js" data-account-id="<your-account-id>"></script>
```

Your account ID can be found when you log in to the Auditorium and select the account you want use.
