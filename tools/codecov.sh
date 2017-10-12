#!/bin/bash

npm install -g codecov
npm run unittest-cov
bash <(curl -s https://codecov.io/bash) -F unittest
