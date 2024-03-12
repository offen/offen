---
layout: default
title: Understanding the development setup
nav_order: 4
description: "An in-depth look at the development setup for Offen Fair Web Analytics and how to work with it."
permalink: /developing-offen/understanding-development-setup/
parent: For developers
---

<!--
Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Understanding the development setup

When built for production use, Offen Fair Web Analytics builds into a single binary file that includes the server application, as well as all static assets like Stylesheets and JavaScript files that it serves. This is great for distribution, but it's a tedious process getting in the way of a rapid feedback cycle in development. This is why when running the development environment the following setup will be launched instead:

- the `server` application starts and is routed as-is through an `nginx` reverse proxy. Package [refresh][] is used to live reload the application on code changes
- on top of the server application, the routes for the client side sub-applications (the `auditorium`, the `vault`  and the `script`) are overridden by the `nginx` setup and routed to a [live-reloading development version][budo] of these subapps

All routes served are identical to the compiled version so the development environment will behave just like a production one, only with automated rebuilding and faster feedback.

## Running tests

To run the test of a single container, the easiest way is using `docker compose` to execute the command inside the container, e.g.:

```
docker compose run --rm auditorium npm t
```

for client containers and

```
docker compose run --rm server make test
```

for the server application.

Running all tests for all containers can be done using:

```
make test
```

[refresh]: https://github.com/markbates/refresh
[budo]: https://github.com/mattdesl/budo

## Handling localization

All of the subapplications use a "gettext"-style approach for handling localization of strings. This means, any user facing string should appear in the source code in English (which is the default locale), and wrapped using the `__` function.

In JavaScript this would look like:

```js
return html`
  <h1>${__('Welcome to Offen')}</h1>
`
```

and like this in a Go template:

{% raw  %}
```go
<h1>{{ __ "Welcome to Offen" }}</h1>
```
{% endraw  %}

### Extracting strings

The current set of strings can be extracted for all supported locales using the top level `make extract-strings` command. Strings will then be merged into a single PO file for each language that is configured in `./locales/LINGUAS`.

### Running the dev setup using a non-default locale

By default, the dev setup uses english language strings for the UI. If you want to start the local setup using a different locale, you can pass the desired value to `make up`:

```
make up LOCALE=de
```
