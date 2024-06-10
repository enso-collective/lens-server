#!/bin/bash

docker buildx build --platform=linux/amd64 -t us-central1-docker.pkg.dev/enso-collective/lens-images/lens:staging . --push
gcloud compute instances update-container lens-sns-machine
