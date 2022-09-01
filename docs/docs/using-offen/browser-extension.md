---
layout: default
title: Offen Instant Access
nav_order: 2
description: How to install and use the Offen Instant Access browser extension
parent: For users
permalink: /using-offen/browser-extension/

---

<!--
Copyright 2022 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Offen Instant Access

## A browser extension for Offen Fair Web Analytics

Offen Fair Web Analytics is designed to be self hosted software.
This means that every operator that uses it for collecting usage statistics runs their own setup.

To help users who are interested in accessing and managing their data on Offen Fair Web Analytics instances, it comes with a companion browser extension that can be used to keep track of all the sites you have been visiting that use Offen Fair Web Analytics.

When installed, all of the sites will be displayed in the context of any Auditorium a user is viewing, making it easy for users to view data across instances, just like operators can view data across accounts.

The Offen Instant Access browser extension is built on the web extension standard and can be installed in Firefox, Chrome and Edge browsers.

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

Due to the technical design of Offen Fair Web Analytics which aims to reduce potential side-channel tracking vectors, there is no way for the extension to tell whether you have opted in or not.
Therefore, all sites using Offen Fair Web Analytics are collected and displayed, but this is only visible to you.
Unless you have opted in, no usage data is collected for such sites ever.

### I have installed the extension, but no navigation is shown in an Auditorium

The extension requires a newer version of Offen Fair Web Analytics (equal or greater than v1.3.0) to be installed in order to display the navigation.
Contact the operator of the site and ask them to update their installation.
