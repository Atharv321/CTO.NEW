#!/bin/bash

set -e

NAMESPACE=${1:-staging}
RELEASE_NAME=${2:-app}

echo "Rolling back deployment in namespace: $NAMESPACE"

helm rollback $RELEASE_NAME -n $NAMESPACE

echo "Waiting for rollback to complete..."
kubectl rollout status deployment/${RELEASE_NAME}-api -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/${RELEASE_NAME}-web -n $NAMESPACE --timeout=300s

echo "Rollback completed successfully!"
