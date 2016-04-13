!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "Win8WinVer.nsh"
!include "GetParameters.nsh"
!include "GetParent.nsh"

!define MUI_ICON "app.ico"
!insertmacro MUI_LANGUAGE "English"

SilentInstall silent

Name "Modern UI Test"
OutFile "../Brave-win32-x64/resources/BraveDefaults.exe"
RequestExecutionLevel user
Var BraveEXEPath
Var BraveIconPath

Section "Defaults Section" SecDummy


  Push $EXEDIR
  Call GetParent
  POP $0

  StrCpy $BraveEXEPath "$0\Brave.exe"
  StrCpy $BraveIconPath "$0\Brave.exe,0"

  Call GetParameters
  Pop $1

  ; The StartMenuInternet key can be set in HKCU on Win8 and above.
  ${IfNot} ${AtLeastWin8}
    SetShellVarContext all
  ${EndIf}

  ${If} $1 == "/uninstall"
  ${OrIf} $1 == "-uninstall"
    DeleteRegKey SHCTX "SOFTWARE\Classes\BraveHTML"
    DeleteRegKey SHCTX "SOFTWARE\Clients\StartMenuInternet\Brave"
    DeleteRegValue SHCTX "SOFTWARE\RegisteredApplications" "Brave"
  ${Else}
    ; Uninstall icon
    WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Brave" "DisplayIcon" "$BraveIconPath"

    ; Document / protocol handler class
    WriteRegStr SHCTX "SOFTWARE\Classes\BraveHTML" "" "Brave HTML Document"
    WriteRegStr SHCTX "SOFTWARE\Classes\BraveHTML\DefaultIcon" "" "$BraveIconPath"
    WriteRegStr SHCTX "SOFTWARE\Classes\BraveHTML\shell\open\command" "" '"$BraveEXEPath" -- "%1"'

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
  ${EndIf}
SectionEnd
