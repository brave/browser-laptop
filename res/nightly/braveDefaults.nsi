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

Name "BraveNightly"
OutFile "../../BraveNightly-win32-${ARCH}/resources/BraveDefaults.exe"

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

  StrCpy $BraveEXEPath "$0\BraveNightly.exe"
  StrCpy $BraveIconPath "$0\BraveNightly.exe,0"

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
    WriteRegStr HKCU "SOFTWARE\Classes\BraveNightlyHTML" "" "Brave Nightly HTML Document"
    WriteRegStr HKCU "SOFTWARE\Classes\BraveNightlyHTML\DefaultIcon" "" "$BraveIconPath"
    WriteRegStr HKCU "SOFTWARE\Classes\BraveNightlyHTML\shell\open\command" "" '"$BraveEXEPath" "--user-data-dir=brave-nightly" -- "%1"'
  ${EndIf}

  ; If we already have the defaults key, there's nothing to do so we can abort early without even needing to elevate on Win7.
  ${If} $IsUninstall == "0"
    ClearErrors
    ReadRegStr $2 SHCTX "SOFTWARE\RegisteredApplications" "BraveNightly"
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
    DeleteRegKey HKCU "SOFTWARE\Classes\BraveNightlyHTML"
    DeleteRegKey SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly"
    DeleteRegValue SHCTX "SOFTWARE\RegisteredApplications" "BraveNightly"

    SetShellVarContext current
    Delete "$DESKTOP\BraveNightly.lnk"
  ${Else}

    ; Define capabilities
    WriteRegStr SHCTX "SOFTWARE\RegisteredApplications" "BraveNightly" "Software\Clients\StartMenuInternet\BraveNightly\Capabilities"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\StartMenu" "StartMenuInternet" "BraveNightly"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly" "" "BraveNightly"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities" "ApplicationDescription" "BraveNightly is the new and fast web browser that protects your privacy and security by blocking intrusive ads and trackers."
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities" "ApplicationName" "BraveNightly"
    WriteRegDWORD SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\InstallInfo" "IconsVisible" 1
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\shell\open\command" "" "$BraveEXEPath"
    ; File associations
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".htm" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".html" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".shtml" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".xht" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".xhtml" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\FileAssociations" ".webp" "BraveNightlyHTML"
    ; Protocol associations
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\URLAssociations" "ftp" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\URLAssociations" "http" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\URLAssociations" "https" "BraveNightlyHTML"
    WriteRegStr SHCTX "SOFTWARE\Clients\StartMenuInternet\BraveNightly\Capabilities\URLAssociations" "mailto" "BraveNightlyHTML"
    ; Uninstall icon
    SetRegView 64
    WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\BraveNightly" "DisplayIcon" "$BraveIconPath"
  ${EndIf}
SectionEnd
