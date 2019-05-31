#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals
import logging

# If your site is available via HTTPS, make sure SITEURL begins with https://
#SITEURL = 'https://www.offen.dev'
RELATIVE_URLS = False

AUTHOR = 'offen'
SITENAME = 'offen'
SITEURL = ''
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



# added configs ----------------------------------------------

THEME = './theme'

# Delete the output directory before generating new files.
DELETE_OUTPUT_DIRECTORY = True

# dont create following standard pages
AUTHORS_SAVE_AS = None
ARCHIVES_SAVE_AS = None
CATEGORIES_SAVE_AS = None
TAGS_SAVE_AS = None

# The default metadata you want to use for all articles and pages.
DEFAULT_METADATA = {
    'description': 'offen is a free and open source analytics software for websites and web applications that allows respectful handling of data.'
}
