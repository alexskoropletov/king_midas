#!/usr/bin/env bash

npx cypress run --spec ./cypress/integration/vktarget/ver.3.watcher.js > "logs/watcher-"`date +"%Y-%m-%d-%H:%M.log"` &
#sleep 2
#npx cypress run --spec ./cypress/integration/vktarget/ver.3.insta.js > "logs/insta-"`date +"%Y-%m-%d-%H:%M.log"` &
#sleep 2
#npx cypress run --spec ./cypress/integration/vktarget/ver.3.vk.js > "logs/vk-"`date +"%Y-%m-%d-%H:%M.log"` &
