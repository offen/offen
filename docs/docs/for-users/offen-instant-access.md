---
layout: default
title: Offen Instant Access
nav_order: 1
description: How to install and use the Offen Instant Access Browser Extension
permalink: /offen-fair-web-analytisc/for-users/offen-instant-access
parent: For users
---

<!--
Copyright 2022 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Offen Instant Access

A browser extension for Offen Fair Web Analytics.

Offen Fair Web Analytics is designed to be an analytics software that has both operators and users of websites as its target audience. This section is intended to collect documentation for users who are interested in learning more about the ideas behind Offen and how to use it.


Offen is designed to be self hosted software.
This means that every operator that uses Offen for collecting usage statistics runs their own setup.
To help users who are interested in accessing and managing their data on Offen instances, Offen comes with a companion browser extension that can be used to keep track of all the sites you have been visiting that use Offen.
When installed, all of the sites will be displayed in the context of any Auditorium a user is viewing, making it easy for users to view data across instances, just like operators can view data across accounts.

The Offen Instant Access Browser Extension is built on the web extension standard and can be installed in Firefox, Chrome and Edge browsers.

## Installation

Users of Firefox can install the extension from the [Mozilla Add Ons Store][mozilla-add-ons].
Everyone else can download the extension from the [official releases page][releases].

[mozilla-add-ons]: https://addons.mozilla.org/
[releases]: https://github.com/offen/offen/releases

## FAQ

### Where is extension data being stored?

The extension stores a list of sites you have visited on your local computer.
This data is only accessible to the extension itself and will not be accessible by any website or other program.
Data is wiped when the extension is unistalled.

### Can operators see if I am using the extension?

No.
There is no way for operators to tell whether you have installed the extension or not.
Extra content for the Auditorium is generated on your computer and will never be visible to others.

### Why does the extension show sites where I did not opt in?

Due to the technical design of Offen which aims to reduce potential side-channel tracking vectors, there is no way for the extension to tell whether you have opted in or not.
Therefore, all sites using Offen are collected and displayed, but this is only visible to you.
Unless you have opted in, no usage data is collected for such sites ever.

### I have installed the extension, but no navigation is shown in an Auditorium

The extension requires a newer version of Offen (equal or greater than v1.3.0) to be installed in order to display the navigation.
Contact the operator of the site and ask them to update their installation.
