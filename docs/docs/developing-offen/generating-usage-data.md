---
layout: default
title: Generating usage data for development
nav_order: 7
description: "How to generate usage data while developing Offen."
permalink: /developing-offen/generating-usage-data/
parent: Developing Offen
---

<!--
Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Generating usage data for development

As all usage data is encrypted and bound to user keys it is not possible to easily provide a predefined set of seed data to be used for development.

In the default development setup, a dummy site served at <http://localhost:8081> deploys the Offen script using the "develop" account that is available using the development login. This means you can manually create usage data by visiting and navigating this site.
