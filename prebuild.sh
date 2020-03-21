#!/usr/bin/env bash

echo "Starting prebuild process"

USER_SET_BRANCH=$1

DETECTED_BRANCH=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
BRANCH="${USER_SET_BRANCH:-$DETECTED_BRANCH}"

# Set branch on which the CMS edits files by creating
# the netlify config from the netlify-cms-config and overwrite
# the branch setting.
yes | cp -rf ./netlify-cms-config.yml ./static/admin/config.yml
sed -i -e "s|NETLIFY_CMS_BRANCH|$BRANCH|g" ./static/admin/config.yml
