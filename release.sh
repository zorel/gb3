#!/usr/bin/env sh
CODEBERG_USER="devnewton"
GB3_VERSION=0.65

curl --user "${CODEBERG_USER}:${CODEBERG_TOKEN}" --upload-file gb0 https://codeberg.org/api/packages/devnewton/generic/gb3/${GB3_VERSION}/gb0
curl --user "${CODEBERG_USER}:${CODEBERG_TOKEN}" --upload-file gb2c https://codeberg.org/api/packages/devnewton/generic/gb3/${GB3_VERSION}/gb2c
curl --user "${CODEBERG_USER}:${CODEBERG_TOKEN}" --upload-file gc2.tar.gz https://codeberg.org/api/packages/devnewton/generic/gb3/${GB3_VERSION}/gc2.tar.gz
curl --user "${CODEBERG_USER}:${CODEBERG_TOKEN}" --upload-file cachetotoz https://codeberg.org/api/packages/devnewton/generic/gb3/${GB3_VERSION}/cachetotoz
