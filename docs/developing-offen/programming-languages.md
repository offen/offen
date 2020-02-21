---
layout: default
title: Programming Languages
nav_order: 3
description: "An introduction to the languages chosen to develop Offen."
permalink: /developing-offen/programming-languages/
parent: Developing Offen
---

# Programming Languages

The server side application is written in [Go][golang] while the client is written in plain JavaScript

[golang]: https://golang.org

## Go

Go is currently at version 1.13 and all code can expect all features present in that version. Formatting happens using [`go fmt`][fmt] and [`go vet`][vet] is enforced in CI. In case you would like to contribute to Offen, but haven't used Go before don't be scared. It is easy to pick up and has great learning resources, head over to the [Go wiki][wiki] if you're interested.

[fmt]: https://blog.golang.org/go-fmt-your-code
[vet]: https://golang.org/cmd/vet/
[wiki]: https://github.com/golang/go/wiki

## JavaScript

Code is following the [Standard JS][standard] styleguide which is enforced in CI. Unit tests are being run using [mochify.js][mochify] which means you can access a native and up-to-date DOM API in your tests.

[babel]: https://babeljs.io/
[standard]: https://standardjs.com/
[mochify]: https://github.com/mantoni/mochify.js
[nanohtml]: https://github.com/choojs/nanohtml
