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

  ; Document / protocol handler class
  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML" "" "Brave HTML Document"
  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML\DefaultIcon" "" "$BraveIconPath"
  WriteRegStr HKCU "SOFTWARE\Classes\BraveHTML\shell\open\command" "" '"$BraveEXEPath" -- "%1"'

  ; Uninstall icon
  WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Brave" "DisplayIcon" "$BraveIconPath"

  ; The StartMenuInternet key can be set in HKCU on Win8 and above.
  ${IfNot} ${AtLeastWin8}
    SetShellVarContext all
  ${EndIf}
  ; Define capabilities
  WriteRegStr SHCTX "SOFTWARE\RegisteredApplications" "Brave" "Software\Clients\StartMenuInternet\Brave\Capabilities"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\StartMenu" "StartMenuInternet" "Brave"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave" "" "Brave"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities" "ApplicationDescription" "Brave is a web browser that runs webpages and applications with lightning speed. It's fast, stable, and easy to use. Browse the web more safely with malware and phishing protection built into Brave."
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities" "ApplicationName" "Brave"
  WriteRegDWORD SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\InstallInfo" "IconsVisible" 1
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\shell\open\command" "" ""
  ; File associations
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".htm" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".html" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".shtml" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".xht" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".xhtml" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\FileAssociations" ".webp" "BraveHTML"
  ; Protocol associations
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "ftp" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "http" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "https" "BraveHTML"
  WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave\Capabilities\URLAssociations" "mailto" "BraveHTML"
  SetShellVarContext current
SectionEnd
