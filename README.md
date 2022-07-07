<!--
Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

<a href="https://www.offen.dev/">
    <img src="https://offen.github.io/press-kit/offen-material/gfx-GitHub-Offen-logo.svg" alt="Offen logo" title="Offen" width="150px"/>
</a>

# Fair web analytics

[![CircleCI](https://circleci.com/gh/offen/offen/tree/development.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/development)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Docs](https://img.shields.io/badge/Documentation-docs.offen.dev-blue.svg)](https://docs.offen.dev)
[![Awesome Humane Tech](https://raw.githubusercontent.com/humanetech-community/awesome-humane-tech/main/humane-tech-badge.svg?sanitize=true)](https://github.com/humanetech-community/awesome-humane-tech)
[![REUSE status](https://api.reuse.software/badge/github.com/offen/offen)](https://api.reuse.software/info/github.com/offen/offen)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/offen/offen.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/offen/offen/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/offen/offen.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/offen/offen/context:javascript)

__Let your users access their data.  
Gain valuable insights at the same time.  
Open, lightweight, self hosted and free.__

## Contents

__Software__
- [Core features](#core-features)
- [How it works](#how-it-works)
- [Essential metrics](#essential-metrics)
- [Objectives](#objectives)
- [Localize](#localize)
- [Customize](#customize)
- [Test drive](#test-drive)
- [License](#license)
- [Project status](#project-status)

__Community__
- [Feedback and contributions welcome](#feedback-and-contributions-welcome)
- [Kind support](#kind-support)
- [Who's using Offen?](#whos-using-offen)
- [Links](#links)

## Core features

__Secure & free__  
Our code is open source.
All usage data is encrypted end-to-end.
Offen will always be available for free.

__Self hosted__  
Comply with GDPR guidelines.
No ads, no third parties involved.
Offen uses first-party cookies only.

__Fair & by choice__  
Opt-in only.
Users must actively give their consent to data collection.
They have full access to their data.

## How it works

__Your job__
- Self host Offen while protecting your users' data.  
- Integrate the code snippet into pages you want to track.  
- Make your users aware of the access to their data.  
- Improve your services with fair and transparent insights.  

__Benefits for your users__
- Opt in to data collection or decide to not participate at all.  
- Review own data with detailed explanations of metrics and terms.  
- Only delete usage data or opt out completely at any time.  

__What you see__  
Data of all pages where your Offen installation is active.
For example:

![Example A](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Example-A.svg)

__What your users see__  
Data of all pages a user has visited where your Offen installation is active. For example:

![Example B](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Example-B.svg)

__More features__
- Easily analyze multiple websites within one installation.
- All website accounts can be shared within teams.
- User data is only stored for 6 months and then deleted.  
- A detailed documentation on how to run Offen is available.  

## Essential metrics

All important statistics that help you to improve your service.  
Filter collected data by URL, Location, Referrer, UTM parameters, as well as Landing Pages and Exit Pages.
![Essential metrics](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Metrics.svg)

## Objectives

__Privacy friendly__  
Collection of usage data is opt in, users that do not actively opt in will never leave a trace.
After opt in, Offen collects the minimal amount of data needed to generate meaningful statistics for operators.
No IPs, User-Agent strings or similar are being collected or even looked at.

__Secure__  
Data in Offen is encrypted End-To-End.
Clients encrypt usage data before it leaves the browser and there is no way for the server storing this data to decrypt it.
Attackers have no means to compromise an instance, accidental data leaks cannot expose user data.

__Self hosted and lightweight__  
You can run Offen on-premises, or in any other deployment scenario that fits your need.
All you need to do is download a single binary file or pull a Docker image, and run it on your server.
Offen will automatically install and renew SSL certificates for you if you want it to.
If you do not want to deploy a dedicated database, you can use SQLite to store data directly on the server.

__Transparent and fair__  
Offen treats the user as a party of equal importance in the collection of usage data.
Users have access to the same set of tools for analyzing their own data and they can delete their data at any time.

## Localize

__Offen is currently available in English, French, German, Portuguese, Spanish and Vietnamese.__
Our consent banner and the Auditorium for operators as well as users can be displayed in the respective locale.  

Support fair web analytics by contributing Italian, Chinese and other language versions. [Request an invite.][]

[Request an invite.]: mailto:hioffen@posteo.de

## Customize

The Offen consent banner is customizable in __color, shape and basic font specifications__ to match your design. [Learn more.][]

[Learn more.]: https://docs.offen.dev/running-offen/customizing-consent-banner/

## Test drive

Give Offen a test drive right now. Open your terminal and type:

```sh
curl https://demo.offen.dev | bash
```

This creates an ephemeral one-off installation that is populated with random data and is running on `http://localhost:9876`.
There, you can log in using the account `demo@offen.dev` and password `demo`.

## License

Work in this repository is licensed under multiple licences.

- All original source code is licensed under [Apache-2.0][license-apache].
- All documentation is licensed under [Apache-2.0][license-apache].
- The Offen icon and logo are licensed as [CC-BY-NC-ND-4.0][license-cc].

See the [NOTICE][notice] file for license information on works that get bundled by Offen.

[license-apache]: https://github.com/offen/offen/blob/development/LICENSES/Apache-2.0.txt
[license-cc]: https://github.com/offen/offen/blob/development/LICENSES/CC-BY-NC-ND-4.0.txt
[notice]: https://github.com/offen/offen/blob/development/NOTICE

## Project status

__Offen is in active development.__  
Check our [roadmap][] and [blog][] for detailed updates on what we are working on right now and what's up next.

[roadmap]: https://github.com/offen/offen/projects/1
[blog]: https://www.offen.dev/blog/

## Feedback and contributions welcome

Found an issue or want to add something? Please do not hesitate to file an issue or open a pull request (or send an email in case you don't want to use GitHub).
For details on how to get started head over to our [contributing guidelines.](https://github.com/offen/offen/blob/development/CONTRIBUTING.md)

---

This repository contains all source code needed to work on Offen, both on the server as well as on the client.
The development setup requires `docker` and `docker-compose` to be installed.

After cloning the repository

```
$ git clone git@github.com:offen/offen.git
```

you can build the containers and install dependencies using:

```sh
$ make setup
```

Next seed the database for the `server` application:

```sh
$ make bootstrap
```

You can test your setup by starting the application:

```sh
$ make up
```

which should enable you to access <http://localhost:8080/auditorium/> and use the `Auditorium`

Run the tests for all subapplications using

```sh
$ make test
```

Detailed instructions on how to get started with development can be found at our [dedicated docs site][dev-docs].

[dev-docs]: https://docs.offen.dev/developing-offen/

---

The documentation site at <https://docs.offen.dev> is also part of this repository.
To run this site locally, you can:

```sh
make setup-docs
make docs
```

This will serve the documentation site on <https://localhost:4000>.

## Kind support

[![NLnet Foundation](https://offen.github.io/press-kit/external-material/nlnet-logo.svg)](https://nlnet.nl/)

We are happy to work with [NLnet Foundation,](https://nlnet.nl/) which actively supports our efforts as part of its [Next Generation Internet](https://nlnet.nl/NGI/) initiative.

<a href="https://www.browserstack.com/">
  <img src="https://offen.github.io/press-kit/external-material/browserstack-logo.svg" width="160">
</a>

Cross-Browser testing provided by [BrowserStack](https://www.browserstack.com/).

## Who's using Offen?

Are you using Offen? We're happy to feature you in this README.
Send a PR adding your site or app to this section.

## Links
[Website](https://www.offen.dev/)  
[Docs](https://docs.offen.dev/)  
[Twitter](https://twitter.com/hioffen)  
[Mastodon](https://fosstodon.org/@offen)
