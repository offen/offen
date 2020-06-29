---
layout: default
title: Test drive
nav_order: 9
description: "Test drive Offen on your system today."
permalink: /running-offen/test-drive/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Test drive

---

If you just want to experiment with Offen or give it a quick test drive, you can run the application in demo mode.

Open your terminal and type:

```
curl -sS https://demo.offen.dev | bash  
```
{: .mb-8 }

You can do the same using our official Docker image:

```
docker run --rm -it -p 9876:9876 offen/offen:latest demo -port 9876  
```
{: .mb-8 }

If you have already downloaded the binaries use:

```
./offen demo  
```
{: .mb-8 }

Head to the URL printed in the terminal and start your testing. You can log in using the account `demo@offen.dev` and password `demo`.
