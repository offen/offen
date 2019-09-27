# This file is only used if you use `make publish` or
# explicitly specify it as your config file.

import os
import sys
sys.path.append(os.curdir)
from pelicanconf import *

# If your site is available via HTTPS, make sure SITEURL begins with https://
SITEURL = os.environ.get('SITEURL', 'https://www.offen.dev')
# RELATIVE_URLS = True

FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/{slug}.atom.xml'

DELETE_OUTPUT_DIRECTORY = True

PLUGINS += ['optimize_images']

OFFEN_ACCOUNT_ID = '5ec8345a-2a45-4eb9-92e5-8d9e5684db58'
