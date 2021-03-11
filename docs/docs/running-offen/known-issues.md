---
layout: default
title: Known issues
nav_order: 12
description: "Known issues when running Offen and their possible workarounds"
permalink: /running-offen/known-issues/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Known issues
{: .no_toc }

This page collects known issues when running Offen and tries to give advice on how to fix or work around these issues.

If you have questions about any of these topics, feel free to [open an issue in our GitHub repository][issues] or send us an email at <hioffen@posteo.de>.

[issues]: https://github.com/offen/offen/issues

---
## Table of contents
{: .no_toc }

1. TOC
{:toc}
---

## Login stops working after migrating an instance to new hardware

GitHub issue [506][login-issue]

### Cause of the issue
{: .no_toc }

Starting with Offen version `v0.1.1` a bug got introduced that inadvertently tied hashed passwords and derived keys to the number of CPUs available on the host system. This means you would be able to move your instance to a host with the same number of CPUs easily, but once the new host had less or more CPUs, operator login would stop working.

While we can fix this issue for future versions and installs easily, there is no way for us to simply fix this for existing installs. We have, however implemented a workaround that allows you to migrate your instance to any new host without losing your ability to log in.

### Workaround
{: .no_toc }

Assuming you have installed an Offen version in between `v0.1.1` and `v0.2.0`, you can work around this issue by doing the following:

1. Find out the number of CPUs available to your host system when you first installed Offen. If you are using a VPS to host Offen, you can look up this value in your server specs. Alternatively you can use commands like `lscpu`, run from the host system.
1. Upgrade to Offen `v0.2.1` or later
1. In your setup, define an environment variable called `OFFEN_ARGONNUMCPUOVERRIDE` (this has to be a proper environment variable and cannot go into an `offen.env` file or similar) and set its value to the number of CPUs you found out in step 1.

You can now move your instance between hosts of any size. The environment variable needs to be set as long as any logins that have been created before the upgrade are still in use.

__Heads Up__
{: .label .label-red }

__This bug does not bring security implications of any kind.__ Your passwords are always stored securely, no matter which version you installed. Any possible impact of the change in password hashing is solely performance related, and is likely to be non-noticeable to end users.

[login-issue]: https://github.com/offen/offen/issues/506

## Offen does not work when running behind a Cloudflare proxy

GitHub issue [564][cloudflare-issue]

### Cause of the issue
{: .no_toc }

Offen serves scripts with an [SRI hash value][mdn-sri] to protect from MITM attacks on the content served. Some Cloudflare proxy settings seem to alter the contents of the script's content, in turn failing the client side integrity check with an error message like this:

```
Failed to find a valid digest in the 'integrity' attribute for resource 'https://offen.mysite.org/vault/vendor-cdc94dde8f.js' with computed SHA-256 integrity '7h+DJVtMpNr1FVMcCV2spIwSjnKvTKLBR8VCunEO6IE='. The resource has been blocked.
```

### Workaround
{: .no_toc }

If you cannot get the Cloudflare proxy to serve content unaltered, turning off the proxy can be your solution. If you rely on Cloudflare for handling SSL certifcates, [you can also have Offen handle this for you instead][configuration].

__Heads Up__
{: .label .label-red }

__You can still use Cloudflare for DNS with Offen.__ This only affects setups where the Cloudflare proxy is used.

[cloudflare-issue]: https://github.com/offen/offen/issues/564
[configuration]: ../configuring-the-application/
[mdn-sri]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
