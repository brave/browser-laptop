# Overview

The telemetry is used to (optionally) send timing information to a [vault-collector](https://github.com/brave/vault-collector) instance. Typically this will be used in a C.I. system to identify performance regressions.

## Setup

The following environment variables must be set for the telemetry system to be enabled:

1. TELEMETRY_URL - url to [vault-collector](https://github.com/brave/vault-collector) endpoint
2. TELEMETRY_MACHINE - string identifier of the machine (i.e. MacBookPro)
3. TELEMETRY_TOKEN - string used to authenticate POST to [vault-collector](https://github.com/brave/vault-collector)

The following environment variables may be set if desired:

1. TELEMETRY_DEBUG - turn on logging to console of telemetry info
2. TELEMETRY_VERSION - string in format X.X.X used to override version number

## Usage

The browser will automatically create an `init` checkpoint before it begins its startup sequence.

Use the `setCheckpointAndReport` function to send telemetry information.

`telemetry.setCheckpointAndReport('startup-complete')`

This will issue a telemetry POST with the `measure` set to `startup-complete` and the `value` set to the amount of time since the `init` checkpoint was set.

## API

* `setCheckpoint(checkpoint, [ts])` - set a checkpoint without sending telemetry

* `clearCheckpoint(checkpoint)` - clear a previously set checkpoint

* `deltaBetween(checkpoint1, checkpoint2)` - return timing difference between two checkpoints

* `setCheckpointAndReport(checkpoint, [initialCheckpoint], [extra], [ts])` - set a checkpoint and send telemetry

## Extra

Each telemetry POST may contain an object with `extra` information. This should be passed as the third parameter to the `setCheckpointAndReport` function.

`setCheckpointAndReport('ready', 'init', { lastCommit: 'a3e5fa3' })`
