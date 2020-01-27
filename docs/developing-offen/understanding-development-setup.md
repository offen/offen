---
layout: page
title: Understanding The Development Setup
nav_order: 4
description: "An in-depth look at the development setup for Offen and how to work with it."
permalink: /developing-offen/understanding-development-setup/
parent: Developing Offen
---

# Understanding the Development Setup

When built for production use, Offen builds into a single binary file that includes the server application, as well as all static assets like Stylesheets and JavaScript files that it serves. This is great for distribution, but it's a tedious process getting in the way of a rapid feedback cycle in development. This is why when running the development environment the following setup will be launched instead:

- the `server` application starts and is routed as-is through an `nginx` reverse proxy. Package [refresh][] is used to live reload the application on code changes
- on top of the server application, the routes for the client side sub-applications (the `auditorium`, the `vault`  and the `script`) are overridden by the `nginx` setup and routed to a [live-reloading development version][budo] of these subapps

All routes served are identical to the compiled version so the development environment will behave just like a production one, only with automated rebuilding and faster feedback.

## Running tests

To run the test of a single container, the easiest way is simply using `docker-compose` to execute the command inside the container, e.g.:

```
docker-compose run --rm auditorium npm t
```

for client containers and

```
docker-compose run --rm server make test
```

for the server application.

Running all tests for all containers can be done using:

```
make test
```

[refresh]: https://github.com/markbates/refresh
[budo]: https://github.com/mattdesl/budo

## Handling localization

All of the subapplications use a "gettext"-style approach for handling localization of strings. This means, any user facing string should appear in the source code in english (which is the default locale), and wrapped using the `__` function.

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

The current set of strings can be extracted for all supported locales using the top level `make extract-strings` command. Each subapp contains a `locales` folder containing the generated `.po` files.
