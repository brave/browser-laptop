# Elevation based on original script courtesy of Ben Armstrong
# https://blogs.msdn.microsoft.com/virtual_pc_guy/2010/09/23/a-self-elevating-powershell-script/

# Get the ID and security principal of the current user account
$myWindowsID=[System.Security.Principal.WindowsIdentity]::GetCurrent()
$myWindowsPrincipal=new-object System.Security.Principal.WindowsPrincipal($myWindowsID)
 
# Get the security principal for the Administrator role
$adminRole=[System.Security.Principal.WindowsBuiltInRole]::Administrator
 
# Check to see if we are currently running "as Administrator"
if ($myWindowsPrincipal.IsInRole($adminRole)) {
   # We are running "as Administrator" - so change the title and background color to indicate this
   $Host.UI.RawUI.WindowTitle = $myInvocation.MyCommand.Definition + "(Elevated)"
   $Host.UI.RawUI.BackgroundColor = "DarkBlue"
   Clear-Host
} else {
   # We are not running "as Administrator" - so relaunch as administrator
   
   # Create a new process object that starts PowerShell
   $newProcess = new-object System.Diagnostics.ProcessStartInfo "PowerShell";
   
   # Specify the current script path and name as a parameter
   $newProcess.Arguments = $myInvocation.MyCommand.Definition;
   
   # Indicate that the process should be elevated
   $newProcess.Verb = "runas";
   
   # Start the new process
   [System.Diagnostics.Process]::Start($newProcess);
   
   # Exit from the current, unelevated, process
   exit
}
 
# Run your code that needs to be elevated here
$node_path = Get-Command("node")
if ($? -eq $false) {
    "ERROR: `"node`" was not found. Is it installed? Does the `"PATH`" environment variable include the path to nodejs? (ex: `"c:\Program Files\nodejs\`""
    exit
}

$node_install_dir = Split-Path $node_path.Path
if (-Not (Test-Path($node_install_dir))) {
    "ERROR: directory not found `"$node_install_dir`""
    exit
}

$npm_install_dir = [string]::Join([IO.Path]::DirectorySeparatorChar, ($node_install_dir, "node_modules", "npm"))
if (-Not (Test-Path($npm_install_dir))) {
    "ERROR: directory not found `"$npm_install_dir`""
    exit
}

$package_json = [string]::Join([IO.Path]::DirectorySeparatorChar, ($npm_install_dir, "package.json"))
if (-Not (Test-Path($package_json))) {
    "ERROR: package.json for node_module/npm not found"
    exit
}

$json = ConvertFrom-Json "$(Get-Content($package_json))"
$modified = $false

$index = $json.bundleDependencies.IndexOf('node-gyp')
if ($index -ne -1) {
    $modified = $true
    [System.Collections.ArrayList]$modifiedList = $json.bundleDependencies
    $modifiedList.RemoveAt($index)
    $json.bundleDependencies = $modifiedList
}

if ($json.dependencies.'node-gyp' -eq "~3.3.1") {
    $modified = $true
    $json.dependencies.'node-gyp' = "~3.4.0"
}

if ($modified) {
    "INFO: backing up old file"
    Move-Item $package_json "$package_json.old" -Force

    "INFO: writing new package.json"
    $json_text = $json | ConvertTo-Json -Compress
    $raw_bytes = [System.Text.Encoding]::ASCII.GetBytes($json_text)
    $stream = [System.IO.File]::OpenWrite($package_json)
    $writer = [System.IO.BinaryWriter]::new($stream)
    $writer.Write($raw_bytes)
    $writer.Close()
} else {
    "INFO: no change needed"
}

"INFO: Running npm install"
cd $npm_install_dir
npm install

"INFO: Done."
Read-Host -Prompt "Press Enter to exit"
