$script_path = Split-Path $MyInvocation.MyCommand.Definition
$expected_path = [string]::Join([IO.Path]::DirectorySeparatorChar, ("browser-laptop", "tools", "windows"))
if (-Not $script_path.EndsWith($expected_path)) {
    "ERROR: aborting. This script expected to be in the following folder: $expected_path"
    exit
}

$repo_root_path = (Get-Item $script_path ).parent.parent.FullName
cd $repo_root_path

if (-Not (Test-Path .\node_modules\electron-prebuilt\dist)) {
    "ERROR: installation appears to be missing node_modules\electron-prebuilt\dist. Has `"npm install`" been ran yet?"
    exit
}

"INFO: building brave as a package"
npm run build-package

"INFO: copying the binaries created from package into electron-prebuilt"
xcopy .\Brave-win32-x64\* .\node_modules\electron-prebuilt\dist\ /Y /S /I /F /R

"INFO: Done."
Read-Host -Prompt "Press Enter to exit"