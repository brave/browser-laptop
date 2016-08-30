$script_path = Split-Path $MyInvocation.MyCommand.Definition
$expected_path = [string]::Join([IO.Path]::DirectorySeparatorChar, ("browser-laptop", "tools", "windows"))
if (-Not $script_path.EndsWith($expected_path)) {
    "ERROR: aborting. This script expected to be in the following folder: $expected_path"
    exit
}

$repo_root_path = (Get-Item $script_path ).parent.parent.FullName
cd $repo_root_path

if (Test-Path ~\.electron) {
    "INFO: removing your old electron install..."
    Remove-Item ~/.electron -Recurse
} else {
    "INFO: you don't appear to have electron installed. Skipping this cleanup step."
}

if (Test-Path .\node_modules) {
    "INFO: removing your old node_modules directory..."
    Remove-Item .\node_modules -Recurse
} else {
    "INFO: you don't appear to have done an npm install. Skipping this cleanup step."
}

"INFO: Running npm install (this will take a while)..."
npm install

"INFO: Done."
Read-Host -Prompt "Press Enter to exit"