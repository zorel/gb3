#!/usr/bin/env sh

GB3_VERSION=0.60

GITLAB_HOST="gitlab.com"
GITLAB_USER="davenewton"

curl -u "${GITLAB_USER}:${GITLAB_TOKEN}" --upload-file gb0 "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb0" | tee /dev/null
curl -u "${GITLAB_USER}:${GITLAB_TOKEN}" --upload-file gb2c "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb2c" | tee /dev/null
curl -u "${GITLAB_USER}:${GITLAB_TOKEN}" --upload-file gc2.tar.gz "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gc2.tar.gz" | tee /dev/null

curl --request POST "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/releases" \
     --header 'Content-Type: application/json' --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
     --data @- <<REQUEST_BODY
{
  "name": "${GB3_VERSION}",
  "tag_name": "${GB3_VERSION}",
  "ref": "master",
  "description": "Release ${GB3_VERSION}",
  "assets": {
    "links": [
      {
        "name": "gb0",
        "url": "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb0",
        "filepath": "/gb0",
        "link_type": "package"
      },
      {
        "name": "gb2c",
        "url": "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb2c",
        "filepath": "/gb2c",
        "link_type": "package"
      },
      {
        "name": "gc2.tar.gz",
        "url": "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_USER}%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gc2.tar.gz",
        "filepath": "/gc2.tar.gz",
        "link_type": "package"
      }
    ]
  }
}
REQUEST_BODY

