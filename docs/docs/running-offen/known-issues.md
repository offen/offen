---
layout: default
title: Known issues
nav_order: 17
description: "Known issues when running Offen Fair Web Analytics and their possible workarounds"
permalink: /running-offen/known-issues/
parent: Operator guide
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Known issues
{: .no_toc }

This page collects known issues when running Offen Fair Web Analytics and tries to give advice on how to fix or work around these issues.

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

Starting with Offen Fair Web Analytics version `v0.1.1` a bug got introduced that inadvertently tied hashed passwords and derived keys to the number of CPUs available on the host system. This means you would be able to move your instance to a host with the same number of CPUs easily, but once the new host had less or more CPUs, operator login would stop working.

While we can fix this issue for future versions and installs easily, there is no way for us to simply fix this for existing installs. We have, however implemented a workaround that allows you to migrate your instance to any new host without losing your ability to log in.

### Workaround
{: .no_toc }

Assuming you have installed an Offen Fair Web Analytics version in between `v0.1.1` and `v0.2.0`, you can work around this issue by doing the following:

1. Find out the number of CPUs available to your host system when you first installed Offen Fair Web Analytics. If you are using a VPS to host it, you can look up this value in your server specs. Alternatively you can use commands like `lscpu`, run from the host system.
1. Upgrade to Offen Fair Web Analytics `v0.2.1` or later
1. In your setup, define an environment variable called `OFFEN_ARGONNUMCPUOVERRIDE` (this has to be a proper environment variable and cannot go into an `offen.env` file or similar) and set its value to the number of CPUs you found out in step 1.

You can now move your instance between hosts of any size. The environment variable needs to be set as long as any logins that have been created before the upgrade are still in use.

__Heads Up__
{: .label .label-red }

__This bug does not bring security implications of any kind.__ Your passwords are always stored securely, no matter which version you installed. Any possible impact of the change in password hashing is solely performance related, and is likely to be non-noticeable to end users.

[login-issue]: https://github.com/offen/offen/issues/506

## Offen Fair Web Analytics does not work when running behind a Cloudflare proxy

GitHub issue [564][cloudflare-issue]

### Cause of the issue
{: .no_toc }

Offen Fair Web Analytics serves scripts with an [SRI hash value][mdn-sri] to protect from MITM attacks on the content served. Some Cloudflare proxy settings seem to alter the contents of the script's content, in turn failing the client side integrity check with an error message like this:

```
Failed to find a valid digest in the 'integrity' attribute for resource 'https://offen.mysite.org/vault/vendor-cdc94dde8f.js' with computed SHA-256 integrity '7h+DJVtMpNr1FVMcCV2spIwSjnKvTKLBR8VCunEO6IE='. The resource has been blocked.
```

### Workaround
{: .no_toc }

If you cannot get the Cloudflare proxy to serve content unaltered, turning off the proxy can be your solution. If you rely on Cloudflare for handling SSL certifcates, [you can also have Offen Fair Web Analytics handle this for you instead][configuration].

__Heads Up__
{: .label .label-red }

__You can still use Cloudflare for DNS with Offen Fair Web Analytics.__ This only affects setups where the Cloudflare proxy is used.

[cloudflare-issue]: https://github.com/offen/offen/issues/564
[configuration]: ../configuring-the-application/
[mdn-sri]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

## Docker based deployment stops working after upgrading to v0.4.0 or later

GitHub PR [575][docker-root-pr]

### Cause of the issue
{: .no_toc }

Up until v0.3.x, the `offen/offen` Docker images were running the application as `root`. This would theoretically allow malicious third party code injected into Offen Fair Web Analytics through supply chain attacks to attempt a container escape and gain priviledged access on the Docker host (this __has not happened in any Offen Fair Web Analytics version__). To prevent this from potentially happening in the future, all images published as v0.4.0 and later run the application [as a dedicated, non-priviledged `offen` user][docker-user-doc].

### Required migration steps
{: .no_toc }

If you are using the `offen/offen` Docker image using a SQLite database and want to migrate to v0.4.0 this requires changing ownership of the database file so that the `offen` user can read and write to that file once updated. This migration likely __requires some service downtime__ and we advise you to __take a backup of your data before updating__.

The steps required to perform are:
1. Stop the running `offen/offen` container
1. Using the __same volume mount configuration as before__ (not part of the below command), you need to run the following command as `root` against the container:
    ```
    chown -R offen:offen /var/opt/offen /etc/offen /var/www/.cache
    ```
When run using `docker` this would look something like this:
    ```
    docker run -v offen_db:/var/opt/offen \
      -v offen_certs:/var/www/.cache \
      --rm -it -u 0 \
      --entrypoint chown offen/offen:{{ site.offen_version }} \
      -R offen:offen /var/opt/offen /etc/offen /var/www/.cache
    ```
1. Restart your service

If you run into problems doing this, roll back your service to use the previous image version which will still work. [Open an issue][issues] on the GitHub repository or send us an email to <hioffen@posteo.de> and we'll try to help you getting this sorted out.

### Alternative workaround
{: .no_toc }

If you do not want to (or cannot) run the above migration steps, you can use the following workaround for now: for all v0.4.x releases we will publish `-root` versions for each tag to Docker Hub. For example, migrating from `v0.3.1` to `v0.4.0` is possible without any intervention by using the `offen/offen:v0.4.0-root` image.

__Heads Up__
{: .label .label-red }

__We recommend applying the migration wherever possible__. The `-root` versions of the images are deprecated and will be __dropped with `v0.5.0`__.

[docker-root-pr]: https://github.com/offen/offen/pull/575
[docker-user-doc]: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user
