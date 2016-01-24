@echo off

REM Enables one-click launching of the latest and greates build at any time, though it takes a moment since it has to first check for an update
REM and if found, download it. It will then compile it regardless, because git exit codes are useless. (0 is success, 1 is error.)

git pull
call CMD /C npm install
call CMD /C start npm run watch
call CMD /C start npm start
