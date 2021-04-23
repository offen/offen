---
layout: default
title: Customizing the the consent banner
nav_order: 8
description: "How to add custom CSS to customize the appearance of the consent banner in Offen"
permalink: /running-offen/customizing-consent-banner/
parent: Running Offen
---

<!--
Copyright 2021 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Customizing the the consent banner
{: .no_toc }

Offen lets you customize the appearance of the consent banner by appending custom CSS defined by you. To edit the CSS, navigate to the "Customize appearance" tab in the Auditorium. Appearance is customized at account level, so you can add different styles for different accounts. It's currently not possible to share the appearance of multiple accounts using other means than manually copy / pasting the contents.

---

## Table of contents
{: .no_toc }
1. TOC
{:toc}

## General considerations when styling the banner

## Blocked CSS properties and values

### Changing the font styles

## Styling the content vs. positioning the banner

## Examples

### Changing colors

### Changing text styles

### Changing spacing

## Markup reference

The consent banner has two states: the initial screen and a follow up in case a user has decided to opt in.

Markup for each state is defined in the [`consent-banner` package][banner-source] and looks like this:

[banner-source]: https://github.com/offen/offen/blob/{{ site.offen_version }}/packages/consent-banner/index.js

### Initial state

```
<div class="banner__host">
  <link rel="stylesheet" href="/fonts.css" onload=${props.onload}>
  <p class="banner__paragraph banner__paragraph--first">
    We only access usage data with your consent.
  </p>
  <p class="banner__paragraph">
    You can opt out and delete any time.
    <a class="banner__anchor" target="_blank" rel="noopener" href="/">
      Learn more
    </a>
  </p>
  <div class="banner__buttons">
    <button class="banner__button banner__button--first">
      I allow
    </button>
    <button class="banner__button banner__button--last">
      I don't allow
    </button>
  </div>
  <style>
    /* default styles go here ... */
  </style>
</div>
<style>
  /* your styles go here ... */
</style>
```

### Follow up

```
<div class="banner__host">
  <link rel="stylesheet" href="/fonts.css" onload=${props.onload}>
  <p class="banner__paragraph banner__paragraph--first">
    Thanks for your help to make this website better.
  </p>
  <p class="banner__paragraph">
    To manage your usage data <a class="banner_anchor" target="_blank" rel="noopener" href="/auditorium/">open the Auditorium.</a>
  </p>
  <div class="banner__buttons">
    <button class="banner__button">
      Continue
    </button>
  </div>
  <style>
    /* default styles go here ... */
  </style>
</div>
<style>
  /* your styles go here ... */
</style>
```

### Default styles

The default stylesheet applied to the banner looks like this:

```
body {
  border-radius: 3px;
  font-size: 1rem;
  line-height: 1.15;
  margin: 0;
  padding: 0;
}

@media all and (max-width: 389px) {
  body {
    font-size: .75rem;
  }
}

.banner__host {
  background-color: #fffdf4;
  border: 1px solid #8a8a8a;
  font-family: roboto, sans-serif;
  padding: 1rem;
}

.banner__paragraph {
  margin: 0 0 1rem 0;
  text-align: center;
}

.banner__paragraph--first {
  margin-bottom: 0.5rem;
}

.banner__anchor {
  color: inherit;
  font-weight: bold;
  text-decoration: none;
}

.banner__buttons {
  display: flex;
  justify-content: center;
}

.banner__button {
  -webkit-appearance: button;
  background-color: #555;
  border: 0;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 100%;
  padding: 0.5rem 0;
  transition: opacity .15s ease-out;
  width: 50%;
}

.banner__button:hover {
  opacity: 0.5;
}

.banner__button--first {
  margin-right: 0.25rem;
}

.banner__button--last {
  margin-left: 0.25rem;
}
```


