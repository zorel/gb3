#!/usr/bin/env sh

GB3_VERSION=0.45

curl -u "devnewton:${FRAMAGIT_TOKEN}" --upload-file gb0 "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb0" | tee /dev/null
curl -u "devnewton:${FRAMAGIT_TOKEN}" --upload-file gb2c "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb2c" | tee /dev/null
curl -u "devnewton:${FRAMAGIT_TOKEN}" --upload-file gc2.tar.gz "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gc2.tar.gz" | tee /dev/null

curl --request POST "https://framagit.org/api/v4/projects/devnewton%2Fgb3/releases" \
     --header 'Content-Type: application/json' --header "PRIVATE-TOKEN: ${FRAMAGIT_TOKEN}" \
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
        "url": "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb0",
        "filepath": "/gb0",
        "link_type": "package"
      },
      {
        "name": "gb2c",
        "url": "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gb2c",
        "filepath": "/gb2c",
        "link_type": "package"
      },
      {
        "name": "gc2.tar.gz",
        "url": "https://framagit.org/api/v4/projects/devnewton%2Fgb3/packages/generic/gb3/${GB3_VERSION}/gc2.tar.gz",
        "filepath": "/gc2.tar.gz",
        "link_type": "package"
      }
    ]
  }
}
REQUEST_BODY

