#!/bin/sh
set -e

exec gosu app "$@"
