---
layout: default
title: Test Drive
nav_order: 1
description: "Just the Docs is a responsive Jekyll theme with built-in search that is easily customizable and hosted on GitHub Pages."
permalink: /running-offen/test-drive
parent: Running Offen
---

# Test Drive

If you just want to experiment with Offen or give it a quick test drive, you can [download the latest binary][repo-releases] for your OS and run the application in demo mode on your local system. It's even easier if you have Docker installed:

```
docker run --rm -it -p 9876:9876 offen/offen:latest demo -port 9876
```

Head to `http://localhost:9876` and start your testing.

[repo-releases]: https://github.com/offen/offen/releases
