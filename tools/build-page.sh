#!/bin/sh
# Standalone copy of the artifact page for local preview
{ printf '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'; cat web/page.html; } > web/index.html
