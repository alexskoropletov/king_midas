#!/usr/bin/env bash

npx cypress run --spec ./cypress/integration/vktarget/ver.3.vk.js > "logs/vk-"`date +"%Y-%m-%d-%H:%M.log"` &
