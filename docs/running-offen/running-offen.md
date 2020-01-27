---
layout: page
title: Running Offen
has_children: true
nav_order: 1
description: "Explaining how to install and configure the Offen web analytics software."
permalink: /running-offen/
---

# Running offen

## Downloads

Offen is distributed as a single binary file, and is currently built for Linux, Windows and MacOS. You can [download the latest release][repo-releases] from our GitHub repository.

[repo-releases]: https://github.com/offen/offen/releases

## Docker Image

All releases are also [published to Docker Hub][docker-hub], and are available as `offen/offen`.

[docker-hub]: https://hub.docker.com/r/offen/offen

## Test Drive

If you just want to experiment with Offen or give it a quick test drive, you can run the application in demo mode:

```
./offen demo
```

You can do the same using our official Docker image:

```
docker run --rm -it -p 9876:9876 offen/offen:latest demo -port 9876
```

Head to `http://localhost:9876` and start your testing.


