#!/usr/bin/env bash

npx cypress run --spec ./cypress/integration/vktarget/ver.3.watcher.js > "logs/watcher-"`date +"%Y-%m-%d-%H:%M.log"` &
