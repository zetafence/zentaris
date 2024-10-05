#!/bin/bash

# start discovery service
echo "starting AWS discovery.."
docker run --platform linux/amd64 --env-file ./aws.sh docker.io/zentaris/zagent:v1.0.0 -oneTime -token "k9MpyVixTTbXKmQjcStXRXr7I9pqI0wGOy96TgeEvgPoaQ4aajqcELjCshwzzFHQ" -profile "awsBehavioralSecurity1a" -server "api.zetafence.com:8443" -org "user@example.com" -group "default" -type "aws"
