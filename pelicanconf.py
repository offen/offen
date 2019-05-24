#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals
import logging

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

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True




# added configs ----------------------------------------------
THEME = 'offen'

# Delete the output directory before generating new files.
DELETE_OUTPUT_DIRECTORY = True

# List of templates that are used directly to render content.
DIRECT_TEMPLATES = ['index','deepdive']

# The static paths you want to have accessible on the output path “static”.
STATIC_PATHS = ['img', 'css']

# The default metadata you want to use for all articles and pages.
DEFAULT_METADATA = {
  'description': 'A brief description of your site',
  'status': 'draft'
}
