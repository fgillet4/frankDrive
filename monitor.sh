#!/bin/bash
ssh mac-mini-local "tail -f ~/frankDrive/logs/backend.log ~/frankDrive/logs/backend.error.log ~/frankDrive/logs/minio.log ~/frankDrive/logs/web.log"
