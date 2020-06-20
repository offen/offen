<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

<a href="https://offen.dev/">
    <img src="https://offen.github.io/press-kit/offen-material/gfx-GitHub-Offen-logo.svg" alt="Offen logo" title="Offen" width="150px"/>
</a>

# Fair web analytics
[![CircleCI](https://circleci.com/gh/offen/offen/tree/development.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/development)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![REUSE status](https://api.reuse.software/badge/github.com/offen/offen)](https://api.reuse.software/info/github.com/offen/offen)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/offen/offen.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/offen/offen/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/offen/offen.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/offen/offen/context:javascript)

Offen is a fair alternative to common web analytics tools. Gain insights while your users have full access to their data. Self hosted, open source and free.

## Contents
- [Core features](#core-features)
- [How it works](#how-it-works)
- [Essential metrics](#essential-metrics)
- [Objectives](#objectives)
- [Test drive](#test-drive)
- [Project status](#project-status)
- [Contributions welcome](#contributions-welcome)
- [Kind support](#kind-support)
- [Give feedback](#give-feedback)
- [License](#license)
- [Links](#links)
 
## Core features
__Free & open__  
Our open source code can be fully audited by the community. It will always be available for free.

__Self hosted__  
Comply with GDPR guidelines. Don't share data with third parties. Your users have full access to their data.

__Fair & secure__  
Opt in only. Users must actively give their consent to data collection. All data is encrypted end-to-end.

## How it works
__Your job__
- Self host Offen and thereby comply with GDPR guidelines.  
- Integrate the code snippet into pages you want to track.  
- Make your users aware of the access to their data.  
- Improve your services with fair and transparent insights.  

__Benefits for your users__
- Opt in to data collection or decide to not participate at all.  
- Review own data with detailed explanations of metrics and terms.  
- Only delete usage data or opt out completly at any time.  

__What you see__  
Data of all pages where your Offen installation is active. For example:

![Example A](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Example-A.svg) 

__What your users see__  
Data of all pages a user has visited where your Offen installation is active. For example:

![Example B](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Example-B.svg)

__More features__
- All your accounts can be shared within your team.  
- User data is only stored for 6 months and then deleted.  
- Use the in-browser screen for a more intuitive setup.  
- A detailed documentation on how to run Offen is available.  

## Essential metrics
All important statistics that help you to improve your service.  
Collected without violating the privacy of your users.  
![Essential metrics](https://offen.github.io/press-kit/offen-material/gfx-GitHub-Metrics.svg)

## Objectives
__Privacy friendly__  
Collection of usage data is opt in, users that do not actively opt in will never leave a trace. After opt in, Offen collects the minimal amount of data needed to generate meaningful statistics for operators. No IPs, User-Agent strings or similar are being collected or even looked at.

__Secure__  
Data in Offen is encrypted End-To-End. Clients encrypt usage data before it leaves the browser and there is no way for the server storing this data to decrypt it. Attackers have no means to compromise an instance, accidental data leaks cannot expose user data.

__Self hosted and lightweight__  
You can run Offen on-premises, or in any other deployment scenario that fits your need. All you need to do is download a single binary file or pull a Docker image, and run it on your server. Offen will automatically install and renew SSL certficates for you if you want it to. If you do not want to deploy a database, you can use SQLite to store data directly on the server.

__Transparent and fair__  
Offen treats the user as a party of equal importance in the collection of usage data. Users have access to the same set of tools for analyzing their own data and they can delete their data at any time.

## Test drive
If you're curious, give it a test drive right now:

```sh
docker run --rm -it -p 9876:9876 offen/offen:latest demo -port 9876
```

This creates an ephemeral one-off installation that is populated with random data and is running on `http://localhost:9876`. There, you can log in using the account `demo@offen.dev` and password `demo`.

## Project status
__Offen is in active development.__ We're happy to help if you would like to experiment with deploying it, but at this point we cannot guarantee any upgrade stability yet. Each release might contain breaking changes that might result in data being lost on the next upgrade. 

We are currently working on __Milestone 5 out of 6: Resilience and documentation.__ Check our [blog][] for detailed updates on what we are working on right now and what's up next.

[blog]: https://www.offen.dev/blog/


## Contributions welcome
This repository contains all source code needed to build and run Offen, both on the server as well as on the client. Also see each of the READMEs in the subdirectories for information on how to work on that particular area of the application.

The development setup requires `docker` and `docker-compose` to be installed.

After cloning the repository, you can build the containers and install dependencies using:

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

Run the tests for all subapplicatons using

```sh
$ make test
```

The documentation site at <https://docs.offen.dev> is also part of this repository. To run this site locally, you can:

```sh
make setup-docs
make docs
```

This will serve the documentation on <https://localhost:4000>.

## Kind support
[![NLnet Foundation](https://offen.github.io/press-kit/external-material/nlnet-logo.svg)](https://nlnet.nl/)

We are happy to work with [NLnet Foundation](https://nlnet.nl/) who complement our activities within their [Next Generation Internet](https://nlnet.nl/NGI/) initiative.

<a href="https://www.browserstack.com/">
  <img src="https://offen.github.io/press-kit/external-material/browserstack-logo.svg" width="160">
</a>

Cross-Browser testing provided by [BrowserStack](https://www.browserstack.com/).

## Give feedback
Found an issue or want to add something? Please do not hesitate to file an issue or open a pull request. For details head to our [contributing guideline.](https://github.com/offen/offen/blob/development/CONTRIBUTING.md)

## License

Offen is licensed under the [Apache 2.0 license](https://github.com/offen/offen/blob/development/LICENSE)

## Links
[Website](https://www.offen.dev/)  
[Docs](https://docs.offen.dev/)  
[Twitter](https://twitter.com/hioffen)  
