#!/bin/sh
installerPath=$1
installerPathPromoCodeRegex='.+-(([a-zA-Z0-9]{3}[0-9]{3})|([a-zA-Z]{1,}-[a-zA-Z]{1,}))([[:blank:]]?\([0-9]+\))?\.pkg$'
echo "Installer path is: $installerPath"

if [[ $installerPath =~ $installerPathPromoCodeRegex ]]; then
  echo "Installer path matched for promo code"
  n=${#BASH_REMATCH[*]}
  if [ $n -ge 1 ]; then
    promoCode=${BASH_REMATCH[1]}
    echo "Got promo code: $promoCode"
  fi
else
  echo "Installer path did not match for promo code"
fi

exit 0
