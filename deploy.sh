#!/bin/bash
# Deploy script for univillage-traceability to Google Cloud Run

set -e

FIREBASE_STORAGE_BUCKET="${FIREBASE_STORAGE_BUCKET:-univillage-503009.firebasestorage.app}"

echo "Deploying univillage-traceability to Cloud Run..."
gcloud run deploy univillage-traceability \
  --source . \
  --project univillage-503009 \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --max-instances 1 \
  --min-instances 0 \
  --set-env-vars "FIREBASE_PROJECT_ID=univillage-503009,FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}"

echo "Deployment finished!"
