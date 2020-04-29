---
layout: default
title: Generating usage data for development
nav_order: 7
description: "How to generate usage data while developing Offen."
permalink: /developing-offen/generating-usage-data/
parent: Developing Offen
---

# Generating usage data for development

As all usage data is encrypted and bound to user keys it is not possible to script the generation of seed data used for development. In the default development setup, a dummy site served at <http://localhost:8081> deploys the Offen script using the "develop" account that is available using the development login. This means you can manually create usage data by visiting and navigating this page.
