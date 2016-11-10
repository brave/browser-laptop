#!/usr/bin/env bash

# stop on errors (nonzero exit codes), uninitialized vars
set -eu

PSL_PATH=js/lib/psl.js
PSL_URL=https://publicsuffix.org/list/public_suffix_list.dat
TEMPFILE=$(mktemp)

trap 'rm $TEMPFILE' EXIT

echo "fetching Public Suffix List ..."
if curl -o "$TEMPFILE" $PSL_URL && [ -s "$TEMPFILE" ]; then
	python tools/convertpsl.py "$TEMPFILE"
	if cmp -s "$TEMPFILE" $PSL_PATH; then
		echo "    no PSL updates"
	else
		cp "$TEMPFILE" $PSL_PATH
		echo "    updated PSL at $PSL_PATH"
		echo "    please verify and commit!"
		exit 0
	fi
else
	echo "    failed to fetch PSL from $PSL_URL"
	echo "    aborting build!"
	exit 1
fi
