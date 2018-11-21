#!/bin/bash
file="/config/config.js"
if [ -f "$file" ]
then
    /bin/cp -rf /config/config.js /gas-relayer/config/.
fi

echo "$@"

exec "$@"

cd /gas-relayer

npm start
