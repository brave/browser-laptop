!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "Win8WinVer.nsh"

!define MUI_ICON "app.ico"
!insertmacro MUI_LANGUAGE "English"

SilentInstall silent

Name "Modern UI Test"
OutFile "BraveDefaults.exe"
RequestExecutionLevel user
Var BraveEXEPath
Var BraveIconPath

Section "Defaults Section" SecDummy

  StrCpy $BraveEXEPath "$EXEDIR\Brave.exe"
  StrCpy $BraveIconPath "$EXEDIR\Brave.exe,0"

  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML" "" "Brave HTML Document"
  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML\DefaultIcon" "" "$BraveIconPath"
  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML\shell\open\command" "" '"$BraveEXEPath" -- "%1"'

  ${If} ${AtLeastWin8}
    WriteRegStr HKCU "SOFTWARE\RegisteredApplications" "Brave" "Software\Clients\StartMenuInternet\Brave\Capabilities"
  ${Else}
    WriteRegStr HKLM "SOFTWARE\RegisteredApplications" "Brave" "Software\Clients\StartMenuInternet\Brave\Capabilities"
  ${EndIf}

  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave" "" "Brave"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities" "ApplicationDescription" "Brave is a web browser that runs webpages and applications with lightning speed. It's fast, stable, and easy to use. Browse the web more safely with malware and phishing protection built into Brave."
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities" "ApplicationIcon" "$BraveIconPath"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities" "ApplicationName" "Brave"

  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".htm" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".html" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".shtml" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".xht" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".xhtml" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".webp" "BraveHTML"

  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\StartMenu" "StartMenuInternet" "Brave"

  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "ftp" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "http" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "https" "BraveHTML"
  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "mailto" "BraveHTML"

  WriteRegDWORD HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\InstallInfo" "IconsVisible" 1

  WriteRegStr HKCU "SOFTWARE\Clients\StartMenuInternet\Brave\shell\open\command" "" ""

  WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Brave" "DisplayIcon" "$BraveIconPath"
SectionEnd
