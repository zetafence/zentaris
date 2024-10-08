#!/bin/bash

# start discovery service
echo "starting resource discovery.."
docker run --platform linux/amd64 --env-file ./credentials.sh docker.io/zentaris/zagent:v1.0.0 -oneTime -token $ZETAFENCE_TOKEN -profile $ZETAFENCE_PROFILE -server "api.zetafence.com:8443" -org $ZETAFENCE_ORG -group "default" -type "aws"
