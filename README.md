This repo contains a menuing system for Internet in a Box

## IIAB Menu

iiab-menu is a menuing system that uses json files for each menu item, which are loaded by and rendered in javascript,
based on an html file that contains an array of the menu items to load. This file will usually be named index.html, but can have
any name.

The menu files are nominally in /library/www/html/iiab-menu, but the index file can be anywhere as the path to supporting files is absolute.
Several sample files are included in the samples directory.

A menu item, a set of links to one piece of content such as the wikipedia, is defined by a 'menu-def' json file.  There is a sample in the samples
directory. There may also be an optional html file that contains free form html to be appended to the menu item entry.

### Installation

A script, cp-menus, is provided to deploy all of these files and does the following:

* creates any needed directories
* copies files such as jquery to WEBROOT/common
* copies files from the repo to WEBROOT/iiab-menu
* copies WEBROOT/iiab-menu/local/menu-defs over the files from the repo
* if WEBROOT/iiab-menu/index.html does not exist, copies samples/index-all.html there
* on subsequent runs it also copies any files with a different date from the original from menu-defs to local


To get the latest version of files please do a git pull on this repo and rerun cp-menus.

### Please Note

Any files changed in WEBROOT/iiab-menu/menu-files will be overwritten by cp-menus.  Therefore cp-menus will attempt
to copy them to WEBROOT/iiab-menu/local in order to preserve them. It does this by making a list of all files
during cp-menus with date and size in order to compare on the next copy.

### Customizing the Deployment

WEBROOT/iiab-menu/config.json contains operating parameters such as

* kiwixPort
* kalitePort
* calibrePort
* apkBaseUrl

### Editing or Customizing Menu Items

The following json fields are currently implemented:

* menu_item_name - this is no longer required, but can be used to document the file
* intended_use - must be one of the following with the following meaning
    html - this content is located in a modules directory under the web root
    webroot - this content is located directly under the web root
    osm - this is osm which has a unique url
    zim - this content is served by kiwix
    kalite - this content is served by kalite
* lang - 2 or 3 char code of language of content; may be different from menu item
* logo_url - image file, assumed to be relative to /iiab-menu/menu-files/images
* moddir - for html modules is the directory under /modules
* start_url - optional suffix to base href without leading slash
* zim_name - generic zim name with out YYYY-MM version suffix
* title - localized title for link
* description - expanded text for link; be careful of text, like quotes, that breaks json
* extra_html - <menu_item_name>.html, optional free form html for submenu or other use
               be careful of embedded quotes, brackets or other characters that will break json
* apk_file - <apk file without full path>, is only relevant for zim items, assumed to be relative to /content/apks

Extra Html File

If extra_html is declared that file will be loaded and appended to the the menu item.  In that file all occurences
of ##HREF-BASE## will be replaced with the the leading portion of the url based on the host accessed and any port
or modules, such as schoolserver:8008.
