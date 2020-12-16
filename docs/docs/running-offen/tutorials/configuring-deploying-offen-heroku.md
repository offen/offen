---
layout: default
title: "Configuring and deploying Offen on Heroku"
nav_order: 3
description: "A step by step tutorial on how deploy Offen on Heroku."
permalink: /running-offen/tutorials/configuring-deploying-offen-heroku/
parent: Installation tutorials
grand_parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Configuring and deploying Offen on Heroku
{: .no_toc }

This tutorial walks you through the steps needed to setup and deploy a single-node Offen instance on [Heroku][heroku] using PostgreSQL for storing data.

__All resources created in this tutorial are free of charge__. You might want to upgrade some of them to another plan with costs when running Offen in production though. A single Hobby Dyno ($7 at the time of writing) should be beefy enough to handle most traffic scenarios and will also give you __free and managed SSL for a custom domain__.

<span class="label label-green">Note</span>
If you get stuck or need help, [file an issue][gh-issues], [tweet (@hioffen)][twitter] or [email][email]. If you have installed Offen and would like to spread the word, we're happy to feature you in our README. [Send a PR][edit-readme] adding your site or app and we'll merge it.

[gh-issues]: https://github.com/offen/offen/issues
[twitter]: https://twitter.com/hioffen
[email]: mailto:hioffen@posteo.de
[edit-readme]: https://github.com/offen/offen/edit/development/README.md
[heroku]: https://www.heroku.com/

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Prerequistes

To follow the steps in this tutorial you will need to have created an account with Heroku.

---

## Deploy our template repository

You can automatically deploy our [template repository][template] to Heroku using this button:

<a class="btn btn-outline" target="_blank" href="https://heroku.com/deploy?template=https://github.com/offen/heroku/tree/master">Deploy Offen on Heroku</a>

[template]: https://github.com/offen/heroku

---

Below you will find what you need to do next:

## Set the configuration values

Heroku will now ask you for a name for you instance (you can call this something like `my-offen` for example), the region where to deploy (choose something the one that is geographically close to your users), and a few configuration values:

### Email credentials
{: .no_toc }

Offen needs to send transactional email for the following features:

- Inviting a new user to an account
- Resetting your password in case you forgot it

To enable this, you need supply SMTP credentials to Offen, namely __Host, User, Password and Port__ to the setup form. If you do not know which values to use right now, you can start by using your personal mail account or create a new mailbox using your default email provider.

If you need to look these up, and don't want to do it right away, you can always add these at a later time. __Remember though that you cannot reset account passwords or invite users until email is configured__.

---

## Deploy the app

You are now ready to press the "Deploy app" button. Building the application can take a little while, but you will see the interface updating while Offen is being installed for you.

## Creating an account

The final step for your installation is now to create an account that you can use to collect usage data and log in. To do so, head to `/setup/` on your newly installed instance by clicking the "View app" button once installation has finished.

Create your first account and a user by filling and submitting the form. You can always create more accounts and add other users later.

### Test the setup
{: .no_toc }

You can now head to the running application at `https://<your-provided-app-name>.herokuapp.com/login` and login using your given credentials.

---

## Run Offen on your own domain

In a real world setup, you will likely want to [make Offen available as a subdomain of your own domain][same-domain].

[same-domain]: /running-offen/installation-requirements/#usage-of-a-subdomain

### Setting up DNS
{: .no_toc }

To setup DNS first configure Heroku to use your desired custom domain in your app's settings. Now, you can set a CNAME record with your domain registrar from your desired domain to the target given in the response.

### Setting up SSL
{: .no_toc }

Offen requires to be served via SSL. In case you are on a paid plan, Heroku offers free Certificate Management for your domain and there is nothing you need to other than enable it. In case you are using the free plan, you can use self-signed certificates. Instructions can be found [in the Heroku documentation on the topic][heroku-ssl].

[heroku-ssl]: https://devcenter.heroku.com/articles/ssl
