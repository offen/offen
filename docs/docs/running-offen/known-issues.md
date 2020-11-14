---
layout: default
title: Known issues
nav_order: 12
description: "Known issues when runnning Offen and their possible workarounds"
permalink: /running-offen/known-issues/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Known issues

This page collects known issues when running Offen and tries to give advice on how to fix or work around these issues.

If you have questions about any of these topics, feel free to [open an issue in our GitHub repository][issues] or send us an email at <hioffen@posteo.de>.

[issues]: https://github.com/offen/offen/issues

## Login stops working after migrating an instance to new hardware

GitHub issue [506][login-issue]

### Cause of the issue

Starting with Offen version `v0.1.1` a bug got introduced that inadvertently tied hashed passwords and derived keys to the number of CPUs available on the host system. This means you would be able to move your instance to a host with the same number of CPUs easily, but once the new host had less or more CPUs, operator login would stop working.

While we can fix this issue for future versions and installs easily, there is no way for us to simply fix this for existing installs. We have, however implemented a workaround that allows you to migrate your instance to any new host without losing your ability login.

### Workaround

Assuming you have installed an Offen version in between `v0.1.1` and `v0.2.0`, you can work around this issue by doing the following:

1. Find out the number of CPUs available to your host system when you first installed Offen. If you are using a VPS to host Offen, you can look up this value in your server specs. Alternatively you can use commands like `lscpu`, run from the host system.
1. Upgrade to Offen `v0.2.1` or later
1. In your setup, define an environment variable called `OFFEN_ARGONNUMCPUOVERRIDE` and set its value to the number of CPUs you found out in step 1.

You can now move your instance between hosts of any size. The environment variable needs to be set as long as any logins that have been created before the upgrade are still in use.

__Heads Up__
{: .label .label-red }

__This bug does not bring security implications of any kind.__ Your passwords are always stored securely, no matter which version you installed. Any possible impact of the change in password hashing is solely performance related, and is likely to be non-noticeable to end users.

[login-issue]: https://github.com/offen/offen/issues/506
