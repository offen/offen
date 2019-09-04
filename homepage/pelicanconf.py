#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals
import logging

# If your site is available via HTTPS, make sure SITEURL begins with https://
RELATIVE_URLS = False

AUTHOR = 'offen'
SITENAME = 'offen'
PATH = 'content'
TIMEZONE = 'Europe/Berlin'
DEFAULT_LANG = 'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# pagination
DEFAULT_PAGINATION = False


THEME = './theme'

# Delete the output directory before generating new files.
DELETE_OUTPUT_DIRECTORY = True

PLUGIN_PATHS = ['./plugins']
PLUGINS = ['assets']

# dont create following standard pages
AUTHORS_SAVE_AS = None
ARCHIVES_SAVE_AS = None
CATEGORIES_SAVE_AS = None
TAGS_SAVE_AS = None

# keep this for access to page variable
DIRECT_TEMPLATES = []

GITHUB_ORG = 'https://github.com/offen'
CONTACT_EMAIL = 'mail@offen.dev'
PATREON_URL = 'https://www.patreon.com/bePatron?u=21484999'
AUDITORIUM_SCRIPT = 'http://localhost:8080/auditorium/index.js'
