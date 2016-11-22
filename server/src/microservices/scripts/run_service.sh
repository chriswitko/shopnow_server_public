#!/bin/sh
HOME=/root
LOGNAME=root
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
LANG=en_US.UTF-8
SHELL=/bin/sh
PWD=/root

# ./init_service_facebook_auto_offers.sh update_post_interests_users

SERVICE=$(basename "$1.js")
ENV=$2
: ${ENV:='development'}
STREAM_N=$3
: ${STREAM_N:='standard_offer'}
NODE_BIN=$(which node)
LOCATION='/var/www/shopnowapp/server/src/microservices/scripts'

if ps ax | grep -v grep | grep $SERVICE > /dev/null
then
  echo "$SERVICE is already running" 2>&1
  exit 1
else
  echo "$SERVICE is not running" 2>&1
  export NODE_ENV=$ENV
  export STREAM_NAME=$STREAM_N
  # which node
  /root/.nvm/versions/node/v6.0.0/bin/node --harmony_proxies $LOCATION/$SERVICE
fi

