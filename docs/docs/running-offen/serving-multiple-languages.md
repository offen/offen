---
layout: default
title: Serving multiple languages
nav_order: 17
description: How to use Offen on a multi-language site
permalink: /running-offen/serving-multiple-languages/
parent: For operators
---

<!--
Copyright 2022 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Serving multiple languages
{: .no_toc }

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Default language behavior

Offen is available in multiple languages.
By default, UI elements will be using the language that is given in [`OFFEN_APP_LOCALE`][config].

## Adding a `locale` parameter to the script

In case you are running a multi-lingual site, you can adjust the default behavior described above by passing a `locale` data attribute to the script source.
Adding this parameter will override the default value and show the consent UI as well as the Auditorium in a different language.
For example, if you wanted to use Portuguese on a certain page when your default is English, embed the script like this:

```
<script data-locale="pt" src="https://offen.example.com/script.js"></script>
```

Valid values are the same that can be used in [`OFFEN_APP_LOCALE`][config].

[config]: ./../configuring-the-application/

## Linking to a specific version of the Auditorium

This also works for any links to the Auditorium that you would like to place manually by appending a query parameter, e.g.:

```
<a href="https://offen.example.com/auditorium/?locale=en">Access your data</a>
<a href="https://offen.example.com/auditorium/?locale=de">Deine Nutzungsdaten hier</a>
<a href="https://offen.example.com/auditorium/?locale=pt">Acessar seus dados</a>
```
