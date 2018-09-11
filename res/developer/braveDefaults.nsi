!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "..\Win8WinVer.nsh"
!include "..\GetParameters.nsh"
!include "..\GetParent.nsh"
!include "..\StrStr.nsh"

!addplugindir "."
!include "UAC.nsh"

!define MUI_ICON "app.ico"
!insertmacro MUI_LANGUAGE "English"

SilentInstall silent

Name "BraveAdsTest"
OutFile "../../BraveAdsTest-win32-${ARCH}/resources/BraveDefaults.exe"
RequestExecutionLevel user
Var BraveEXEPath
Var BraveIconPath
Var IsElevated
Var IsUninstall

Function .onInit
  ; The StartMenuInternet key can be set in HKCU on Win8 and above.
  ${IfNot} ${AtLeastWin8}
    SetShellVarContext all
  ${EndIf}

  ; Determine if we're elevated currently
  ClearErrors
  WriteRegStr HKLM "Software\Brave" "InstallerTest" "Write Test"
  DeleteRegValue HKLM "Software\Brave" "InstallerTest"
  ${If} ${Errors}
    StrCpy $IsElevated "0"
  ${Else}
    StrCpy $IsElevated "1"
  ${EndIf}

  Push $EXEDIR
  Call GetParent
  Call GetParent
  POP $0

  StrCpy $BraveEXEPath "$0\BraveAdsTest.exe"
  StrCpy $BraveIconPath "$0\BraveAdsTest.exe,0"

  Call GetParameters
  Pop $1

  ; Determine if this is an uninstall or an install
  ${StrStr} $4 $1 "-uninstall"
  ${StrStr} $5 $1 "/uninstall"

  ${If} $4 != ""
  ${OrIf} $5 != ""
    StrCpy $IsUninstall "1"
  ${Else}
    StrCpy $IsUninstall "0"
    ; Document / protocol handler class
    ; These need to always be in HKCU becuase they contain the actual path of the exe which changes
    ; on each update.  If on HKLM then the user could not elevate later and cause a problem.
    ; They should also be in this block early because we always want to re-create on each update.
    WriteRegStr HKCU "SOFTWARE\Classes\BraveAdsTestHTML" "" "BraveAdsTest HTML Document"
    WriteRegStr HKCU "SOFTWARE\Classes\BraveAdsTestHTML\DefaultIcon" "" "$BraveIconPath"
    WriteRegStr HKCU "SOFTWARE\Classes\BraveAdsTestHTML\shell\open\command" "" '"$BraveEXEPath" "--user-data-dir=brave-developer" -- "%1"'
  ${EndIf}

  ; If we already have the defaults key, there's nothing to do so we can abort early without even needing to elevate on Win7.
  ${If} $IsUninstall == "0"
    ClearErrors
    ReadRegStr $2 SHCTX "SOFTWARE\RegisteredApplications" "BraveAdsTest"
    ${IfNot} ${Errors}
      Quit
    ${EndIf}
  ${EndIf}

  ; Elevate if we're on Win7 and below.  Win8 allows keys to be set as HKCU so this is not needed there.
  ${IfNot} ${AtLeastWin8}
  ; Don't even try to elevate if we are already elevated.
  ${AndIf} $IsElevated == "0"
    !insertmacro UAC_RunElevated
    ${Switch} $0
    ${Case} 0
      ${IfThen} $1 = 1 ${|} Quit ${|} ;we are the outer process, the inner process has done its work, we are done
      ${IfThen} $3 <> 0 ${|} ${Break} ${|} ;we are admin, let the show go on
        ;fall-through and die
      ${Case} 1223
        MessageBox mb_IconStop|mb_TopMost|mb_SetForeground "Unable to elevate, Brave will not be able to be set as the default browser."
        Quit
      ${Case} 1062
        MessageBox mb_IconStop|mb_TopMost|mb_SetForeground "Logon service not running, aborting!"
        Quit
        ${Default}
        MessageBox mb_IconStop|mb_TopMost|mb_SetForeground "Unable to elevate , error $0"
        Quit
    ${EndSwitch}
  ${EndIf}
FunctionEnd

Section "Defaults Section" SecDummy
  Call GetParameters
  Pop $1

  ${If} $IsUninstall == "1"
    DeleteRegKey HKCU "SOFTWARE\Classes\BraveAdsTestHTML"
    DeleteRegKey SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest"
    DeleteRegValue SHCTX "SOFTWARE\RegisteredApplications" "BraveAdsTest"

    SetShellVarContext current
    Delete "$DESKTOP\BraveAdsTest.lnk"
  ${Else}

    ; Define capabilities
    WriteRegStr SHCTX "SOFTWARE\RegisteredApplications" "BraveAdsTest" "Software\Clients\StartMenuInternet\BraveAdsTest\Capabilities"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\StartMenu" "StartMenuInternet" "BraveAdsTest"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest" "" "BraveAdsTest"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities" "ApplicationDescription" "BraveAdsTest is the new and fast web browser that protects your privacy and security by blocking intrusive ads and trackers."
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities" "ApplicationName" "BraveAdsTest"
    WriteRegDWORD SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\InstallInfo" "IconsVisible" 1
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\shell\open\command" "" "$BraveEXEPath"
    ; File associations
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".htm" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".html" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".shtml" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".xht" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".xhtml" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\FileAssociations" ".webp" "BraveAdsTestHTML"
    ; Protocol associations
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\URLAssociations" "ftp" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\URLAssociations" "http" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\URLAssociations" "https" "BraveAdsTestHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveAdsTest\Capabilities\URLAssociations" "mailto" "BraveAdsTestHTML"
    ; Uninstall icon
    SetRegView 64
    WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraveAdsTest" "DisplayIcon" "$BraveIconPath"
  ${EndIf}
SectionEnd
