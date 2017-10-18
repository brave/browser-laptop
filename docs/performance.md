# Performance

## Automated tests

We have automated perf tests and you can find them in [tests/performance/](tests/performance/). These work just like the other spectron webdriver tests, however we turn on muon's `--debug` flag and then use the WebKit CPU profiler feature using [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface). This logs JavaScript CPU time and generates a .cpuprofile file.

You can run tests manually with `npm run test -- --grep='^Performance'`.

Travis runs perf tests on every run, and the generated .cpuprofiles are uploaded to S3 then consumed by https://github.com/brave/perfaderp (ask in our chat for access to our internal perfaderp instance) which tracks all test runtimes.

To debug problems, you can examine the .cpuprofiles directly with the browser's JavaScript Profiler tool. From the Brave Inspector, go to the top right Kabob menu -> More tools -> JavaScript Profiler then load the .cpuprofile. Now you can see an aggregate JS function tree with execution times.

## Reducer logging

One source of blocking lag is when the main process runs slow code in reducers. To look for this, enable reducer runtime logs by running Brave with the env variable `REDUCER_TIME_LOG_THRESHOLD={time in ms}`.

Log runtimes slower than 5 ms in development:

```sh
REDUCER_TIME_LOG_THRESHOLD=5 npm run start
```

In a MacOS packaged build:

```
REDUCER_TIME_LOG_THRESHOLD=5 {path to Brave.app}/Contents/MacOS/Brave
```

Logs are written to `{userProfile}/reducer-time-{ISO datetime}.log` by default. You can override this with the env var `REDUCER_TIME_LOG_PATH={path}`.

Log format is `{unix timestamp (ms)},{label},{run time (ms)}`, one event per line:

```
1500588837179,app-add-site,231
1500588855676,app-frame-changed,16
1500588909915,window-set-popup-window-detail,7
```
