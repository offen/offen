---
layout: default
title: Serving multiple languages
nav_order: 13
description: How to use Offen on a multi-language site
permalink: /running-offen/serving-multiple-languages/
parent: Running Offen
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

## Appending a `lang` parameter to the script

In case you are running a multi-lingual site, you can adjust the default behavior described above by passing a `lang` parameter to the script source.
Appending this parameter will override the default value and show the consent UI as well as the Auditorium in a different language.
For example, if you wanted to use Portuguese on a certain page when your default is English, embed the script like this:

```
<script src="https://offen.example.com/script.js?lang=pt"></script>
```

Valid values are the same that can be used in [`OFFEN_APP_LOCALE`][config].

[config]: ./../configuring-the-application/

## Linking to a specific version of the Auditorium

This also works for any links to the Auditorium that you would like to place manually, e.g.:

```
<a href="https://offen.example.com/auditorium/?lang=en">Access your data</a>
<a href="https://offen.example.com/auditorium/?lang=de">Deine Nutzungsdaten hier</a>
<a href="https://offen.example.com/auditorium/?lang=pt">Acessar seus dados</a>
```
