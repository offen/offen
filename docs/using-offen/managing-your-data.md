---
layout: default
title: Managing your usage data
parent: Using Offen
nav_order: 1
description: "How to manage your usage data in Offen."
permalink: /using-offen/managing-your-data/
---

# Managing your usage data
{: .no_toc }

Offen is a fair and transparent web analytics tool that makes usage data visible to users and operators alike. This means that as a user, you have full control over you data.

As a user, it is important to understand that __different websites might use different installations of Offen that are not connected in any way__. Operators cannot connect your usage data across sites, just like your consent decision is only valid for one installation of Offen. This means you can express consent for one site when denying it for another.

---

## Table of Contents
{: .no_toc }

1. TOC
{:toc}


## Data collection requires consent

__Offen does not collect any usage data unless you have explicitly opted in__. On first visit of a webpage that uses Offen, you will see a consent banner that asks you to allow or deny the collection of usage data.

In case you actively allow or deny the collection of data, this preference will be stored in a cookie, so you will not see the banner again until your cookies are cleared. 

You can change this decision at any point in time by visiting the Auditorium.

## The Auditorium

The Auditorium is a simple application that lets you view and manage the usage data a site has collected from you using Offen. It is the same application the operator of the website is using to view usage data. In case you have opted in, you will be displayed the subset of available data that is associated with your user identifier. For an explanation of the metrics displayed, you can have a look at the [Metrics Explained][metrics-explained] article.

The Auditorium is also used to change your consent status (i.e. opt out or opt in) or delete your data.

[metrics-explained]: /using-offen/metrics-explained/

## Changing your consent decision

### Opting out
{: .no_toc }

In case you have opted in the "Privacy" section of the Auditorium will allow you to opt out again. __Opting out will also delete all data__ that has been associated with your user identifier as well as delete this identifier from your browser.

### Opting in
{: .no_toc }

In case you have opted out and want to opt in, you can do so in the "Privacy" section too. After doing so, Offen will start collecting usage data from your visits until you revoke consent again.

## Deleting your data

In case you are opted in, and only want to delete your usage data without changing your consent status, the Auditorium allows you to do so as well. Data is __instantly and permanently deleted__ from the Offen instance without a trace. Operators will not see any of your data included in their reports the next time they log in.

## The user identifier

When generating usage data, Offen creates a random user identifier and stores it in a cookie on your computer. __This identifier is purely random and does not contain any fingerprinting about you or your computer__. In case you decide to delete the cookie but not change your consent decision, Offen will assign a new identifier to you and treat you as a new user. __This also means you won't be able to access the data asscociated with the previous identifier anymore__.

