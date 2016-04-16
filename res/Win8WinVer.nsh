; ---------------------
;      WinVer.nsh
; ---------------------
;
; LogicLib extensions for handling Windows versions and service packs.
;
; IsNT checks if the installer is running on Windows NT family (NT4, 2000, XP, etc.)
;
;   ${If} ${IsNT}
;     DetailPrint "Running on NT. Installing Unicode enabled application."
;   ${Else}
;     DetailPrint "Not running on NT. Installing ANSI application."
;   ${EndIf}
;
; IsServerOS checks if the installer is running on a server version of Windows (NT4, 2003, 2008, etc.)
;
; AtLeastWin<version> checks if the installer is running on Windows version at least as specified.
; IsWin<version> checks if the installer is running on Windows version exactly as specified.
; AtMostWin<version> checks if the installer is running on Windows version at most as specified.
;
; <version> can be replaced with the following values:
;
;   95
;   98
;   ME
;
;   NT4
;   2000
;   XP
;   2003
;   Vista
;   2008
;   7
;   2008R2
;   8
;   2012
;   8.1
;   2012R2
;   10
;
;   Note: Windows 8.1 and later will be detected as Windows 8 unless ManifestSupportedOS is set correctly!
;
; AtLeastServicePack checks if the installer is running on Windows service pack version at least as specified.
; IsServicePack checks if the installer is running on Windows service pack version exactly as specified.
; AtMostServicePack checks if the installer is running on Windows service version pack at most as specified.
;
; Usage examples:
;
;   ${If} ${IsNT}
;   DetailPrint "Running on NT family."
;   DetailPrint "Surely not running on 95, 98 or ME."
;   ${AndIf} ${AtLeastWinNT4}
;     DetailPrint "Running on NT4 or better. Could even be 2003."
;   ${EndIf}
;
;   ${If} ${AtLeastWinXP}
;     DetailPrint "Running on XP or better."
;   ${EndIf}
;
;   ${If} ${IsWin2000}
;     DetailPrint "Running on 2000."
;   ${EndIf}
;
;   ${If} ${IsWin2000}
;   ${AndIf} ${AtLeastServicePack} 3
;   ${OrIf} ${AtLeastWinXP}
;     DetailPrint "Running Win2000 SP3 or above"
;   ${EndIf}
;
;   ${If} ${AtMostWinXP}
;     DetailPrint "Running on XP or older. Surely not running on Vista. Maybe 98, or even 95."
;   ${EndIf}
;
; Warning:
;
;   Windows 95 and NT both use the same version number. To avoid getting NT4 misidentified
;   as Windows 95 and vice-versa or 98 as a version higher than NT4, always use IsNT to
;   check if running on the NT family.
;
;     ${If} ${AtLeastWin95}
;     ${And} ${AtMostWinME}
;       DetailPrint "Running 95, 98 or ME."
;       DetailPrint "Actually, maybe it's NT4?"
;       ${If} ${IsNT}
;         DetailPrint "Yes, it's NT4! oops..."
;       ${Else}
;         DetailPrint "Nope, not NT4. phew..."
;       ${EndIf}
;     ${EndIf}
;
;
; Other useful extensions are:
;
;    * IsWin2003R2
;    * IsStarterEdition
;    * OSHasMediaCenter
;    * OSHasTabletSupport
;

!verbose push
!verbose 3

!ifndef ___WINVER__NSH___
!define ___WINVER__NSH___

!include LogicLib.nsh
!include Util.nsh

# masks for our variables

!define _WINVER_VERXBIT  0x00000001
!define _WINVER_MASKVMAJ 0x7F000000
!define _WINVER_MASKVMIN 0x00FF0000

!define _WINVER_NTBIT    0x80000000
!define _WINVER_NTMASK   0x7FFFFFFF
!define _WINVER_NTSRVBIT 0x40000000
!define _WINVER_MASKVBLD 0x0000FFFF
!define _WINVER_MASKSP   0x000F0000

# possible variable values for different versions

!define WINVER_95_NT     0x04000000 ;4.00.0950
!define WINVER_95        0x04000000 ;4.00.0950
!define WINVER_98_NT     0x040a0000 ;4.10.1998
!define WINVER_98        0x040a0000 ;4.10.1998
;define WINVER_98SE      0x040a0000 ;4.10.2222
!define WINVER_ME_NT     0x045a0000 ;4.90.3000
!define WINVER_ME        0x045a0000 ;4.90.3000
;define WINVER_NT3.51               ;3.51.1057
!define WINVER_NT4_NT    0x84000000 ;4.00.1381
!define WINVER_NT4       0x04000000 ;4.00.1381
!define WINVER_2000_NT   0x85000000 ;5.00.2195
!define WINVER_2000      0x05000000 ;5.00.2195
!define WINVER_XP_NT     0x85010000 ;5.01.2600
!define WINVER_XP        0x05010000 ;5.01.2600
;define WINVER_XP64                 ;5.02.3790
!define WINVER_2003_NT   0x85020000 ;5.02.3790
!define WINVER_2003      0x05020000 ;5.02.3790
!define WINVER_VISTA_NT  0x86000000 ;6.00.6000
!define WINVER_VISTA     0x06000000 ;6.00.6000
!define WINVER_2008_NT   0x86000001 ;6.00.6001
!define WINVER_2008      0x06000001 ;6.00.6001
!define WINVER_7_NT      0x86010000 ;6.01.7600
!define WINVER_7         0x06010000 ;6.01.7600
!define WINVER_2008R2_NT 0x86010001 ;6.01.7600
!define WINVER_2008R2    0x06010001 ;6.01.7600
!define WINVER_8_NT      0x86020000 ;6.02.9200
!define WINVER_8         0x06020000 ;6.02.9200
!define WINVER_2012_NT   0x86020001 ;6.02.9200
!define WINVER_2012      0x06020001 ;6.02.9200
!define WINVER_8.1_NT    0x86030000 ;6.03.9600
!define WINVER_8.1       0x06030000 ;6.03.9600
!define WINVER_2012R2_NT 0x86030001 ;6.03.9600
!define WINVER_2012R2    0x06030001 ;6.03.9600
!define WINVER_10_NT     0x8A000000 ;10.0.10240
!define WINVER_10        0x0A000000 ;10.0.10240


# use this to make all nt > 9x

!ifdef WINVER_NT4_OVER_W95
  !define /redef /math WINVER_NT4 ${WINVER_NT4} | ${_WINVER_VERXBIT}
!endif

# some definitions from header files

!define OSVERSIONINFOW_SIZE   276
!define OSVERSIONINFOEXW_SIZE 284
!define OSVERSIONINFOA_SIZE   148
!define OSVERSIONINFOEXA_SIZE 156
!define /ifndef VER_PLATFORM_WIN32_NT 2
!define /ifndef VER_NT_WORKSTATION    1

!define SM_TABLETPC    86
!define SM_MEDIACENTER 87
!define SM_STARTER     88
!define SM_SERVERR2    89

# variable declaration

!macro __WinVer_DeclareVars

  !ifndef __WINVER_VARS_DECLARED

    !define __WINVER_VARS_DECLARED

    Var /GLOBAL __WINVERV
    Var /GLOBAL __WINVERSP

  !endif

!macroend

# lazy initialization macro

!ifmacrondef __WinVer_Call_GetVersionEx

  !macro __WinVer_Call_GetVersionEx STRUCT_SIZE

    System::Call '*$0(i ${STRUCT_SIZE})'
    System::Call kernel32::GetVersionEx(pr0)i.r3

  !macroend

!endif

!macro __WinVer_InitVars
  # variables
  !insertmacro __WinVer_DeclareVars

  # only calculate version once
  StrCmp $__WINVERV "" _winver_noveryet
    Return
  _winver_noveryet:

  # push used registers on the stack
  Push $0
  Push $1 ;maj
  Push $2 ;min
  Push $3 ;bld
  Push $R0 ;temp

  # a plugin call will lock the Unicode mode, it is now safe to set the struct size
  !ifdef NSIS_UNICODE
  !define /redef OSVERSIONINFO_SIZE ${OSVERSIONINFOW_SIZE}
  !define /redef OSVERSIONINFOEX_SIZE ${OSVERSIONINFOEXW_SIZE}
  !else
  !define /redef OSVERSIONINFO_SIZE ${OSVERSIONINFOA_SIZE}
  !define /redef OSVERSIONINFOEX_SIZE ${OSVERSIONINFOEXA_SIZE}
  !endif

  # allocate memory
  System::Call '*(&i${OSVERSIONINFOEX_SIZE})p.r0'

  # use OSVERSIONINFOEX
  !insertmacro __WinVer_Call_GetVersionEx ${OSVERSIONINFOEX_SIZE}

  IntCmp $3 0 "" _winver_ex _winver_ex
    # OSVERSIONINFOEX not allowed (Win9x or NT4 w/SP < 6), use OSVERSIONINFO
    !insertmacro __WinVer_Call_GetVersionEx ${OSVERSIONINFO_SIZE}
  _winver_ex:

  # get results from struct
  System::Call '*$0(i.s,i.r1,i.r2,i.r3,i.s,&t128.s,&i2.s,&i2,&i2,&i1.s,&i1)'

  # free struct
  System::Free $0

  # win9x has major and minor info in high word of dwBuildNumber - remove it
  IntOp $3 $3 & 0xFFFF

  # get dwOSVersionInfoSize
  Pop $R0

  # get dwPlatformId
  Pop $0

  # NT?
  IntCmp $0 ${VER_PLATFORM_WIN32_NT} "" _winver_notnt _winver_notnt
    IntOp $__WINVERSP $__WINVERSP | ${_WINVER_NTBIT}
    IntOp $__WINVERV  $__WINVERV  | ${_WINVER_NTBIT}
  _winver_notnt:

  # get service pack information
  IntCmp $0 ${VER_PLATFORM_WIN32_NT} _winver_nt "" _winver_nt  # win9x

    # get szCSDVersion
    Pop $0

    # copy second char
    StrCpy $0 $0 1 1

    # discard invalid wServicePackMajor and wProductType
    Pop $R0
    Pop $R0

    # switch
    StrCmp $0 'A' "" +3
      StrCpy $0 1
      Goto _winver_sp_done
    StrCmp $0 'B' "" +3
      StrCpy $0 2
      Goto _winver_sp_done
    StrCmp $0 'C' "" +3
      StrCpy $0 3
      Goto _winver_sp_done
    StrCpy $0 0
    Goto _winver_sp_done

  _winver_nt: # nt

    IntCmp $R0 ${OSVERSIONINFOEX_SIZE} "" _winver_sp_noex _winver_sp_noex

      # discard szCSDVersion
      Pop $0

      # get wProductType
      Exch
      Pop $0

      # is server?
      IntCmp $0 ${VER_NT_WORKSTATION} _winver_noserver _winver_noserver ""
        IntOp $__WINVERSP $__WINVERSP | ${_WINVER_NTSRVBIT}
      _winver_noserver:

      # get wServicePackMajor
      Pop $0

      # done with sp
      Goto _winver_sp_done

    _winver_sp_noex: # OSVERSIONINFO, not OSVERSIONINFOEX

      ####  TODO
      ## For IsServerOS to support < NT4SP6, we need to check the registry
      ## here to see if we are a server and/or DC

      # get szCSDVersion
      Pop $0

      # discard invalid wServicePackMajor and wProductType
      Pop $R0
      Pop $R0

      # get service pack number from text
      StrCpy $R0 $0 13
      StrCmp $R0 "Service Pack " "" +3
        StrCpy $0 $0 "" 13 # cut "Service Pack "
        Goto +2
        StrCpy $0 0 # no service pack

!ifdef WINVER_NT4_OVER_W95
      IntOp $__WINVERV $__WINVERV | ${_WINVER_VERXBIT}
!endif

  _winver_sp_done:

  # store service pack
  IntOp $0 $0 << 16
  IntOp $__WINVERSP $__WINVERSP | $0

  ### now for the version

  # is server?
  IntOp $0 $__WINVERSP & ${_WINVER_NTSRVBIT}

  # windows xp x64?
  IntCmp $0 0 "" _winver_not_xp_x64 _winver_not_xp_x64 # not server
  IntCmp $1 5 "" _winver_not_xp_x64 _winver_not_xp_x64 # maj 5
  IntCmp $2 2 "" _winver_not_xp_x64 _winver_not_xp_x64 # min 2
    # change XP x64 from 5.2 to 5.1 so it's still XP
    StrCpy $2 1
  _winver_not_xp_x64:

  # server 2008?
  IntCmp $0 0 _winver_not_ntserver # server
  IntCmp 6 $1 "" "" _winver_not_ntserver # maj 6
    # extra bit so Server 2008 comes after Vista SP1 that has the same minor version, same for Win7 vs 2008R2
    IntOp $__WINVERV $__WINVERV | ${_WINVER_VERXBIT}
  _winver_not_ntserver:

  # pack version
  IntOp $1 $1 << 24 # VerMajor
  IntOp $__WINVERV $__WINVERV | $1
  IntOp $0 $2 << 16
  IntOp $__WINVERV $__WINVERV | $0 # VerMinor
  IntOp $__WINVERSP $__WINVERSP | $3 # VerBuild

  # restore registers
  Pop $R0
  Pop $3
  Pop $2
  Pop $1
  Pop $0

!macroend

# version comparison LogicLib macros

!macro _WinVerAtLeast _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${CallArtificialFunction} __WinVer_InitVars
  IntOp $_LOGICLIB_TEMP $__WINVERV & ${_WINVER_NTMASK}
  !insertmacro _>= $_LOGICLIB_TEMP `${_b}` `${_t}` `${_f}`
!macroend
!macro _WinVerIs _a _b _t _f
  ${CallArtificialFunction} __WinVer_InitVars
  !insertmacro _= $__WINVERV `${_b}` `${_t}` `${_f}`
!macroend
!macro _WinVerAtMost _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${CallArtificialFunction} __WinVer_InitVars
  IntOp $_LOGICLIB_TEMP $__WINVERV & ${_WINVER_NTMASK}
  !insertmacro _<= $_LOGICLIB_TEMP `${_b}` `${_t}` `${_f}`
!macroend

!macro __WinVer_DefineOSTest Test OS Suffix
  !define ${Test}Win${OS} `"" WinVer${Test} ${WINVER_${OS}${Suffix}}`
!macroend

!macro __WinVer_DefineOSTests Test Suffix
  !insertmacro __WinVer_DefineOSTest ${Test} 95     '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 98     '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} ME     '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} NT4    '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2000   '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} XP     '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2003   '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} VISTA  '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2008   '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 7      '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2008R2 '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 8      '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2012   '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 8.1    '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 2012R2 '${Suffix}'
  !insertmacro __WinVer_DefineOSTest ${Test} 10     '${Suffix}'
!macroend

!insertmacro __WinVer_DefineOSTests AtLeast ""
!insertmacro __WinVer_DefineOSTests Is _NT
!insertmacro __WinVer_DefineOSTests AtMost ""

# version feature LogicLib macros

!macro _IsNT _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${CallArtificialFunction} __WinVer_InitVars
  IntOp $_LOGICLIB_TEMP $__WINVERSP & ${_WINVER_NTBIT}
  !insertmacro _!= $_LOGICLIB_TEMP 0 `${_t}` `${_f}`
!macroend
!define IsNT `"" IsNT ""`

!macro _IsServerOS _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${CallArtificialFunction} __WinVer_InitVars
  IntOp $_LOGICLIB_TEMP $__WINVERSP & ${_WINVER_NTSRVBIT}
  !insertmacro _!= $_LOGICLIB_TEMP 0 `${_t}` `${_f}`
!macroend
!define IsServerOS `"" IsServerOS ""`

# service pack macros

!macro _WinVer_GetServicePackLevel OUTVAR
  ${CallArtificialFunction} __WinVer_InitVars
  IntOp ${OUTVAR} $__WINVERSP & ${_WINVER_MASKSP}
  IntOp ${OUTVAR} ${OUTVAR} >> 16
!macroend
!define WinVerGetServicePackLevel '!insertmacro _WinVer_GetServicePackLevel '

!macro _AtLeastServicePack _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${WinVerGetServicePackLevel} $_LOGICLIB_TEMP
  !insertmacro _>= $_LOGICLIB_TEMP `${_b}` `${_t}` `${_f}`
!macroend
!define AtLeastServicePack `"" AtLeastServicePack`

!macro _AtMostServicePack _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${WinVerGetServicePackLevel} $_LOGICLIB_TEMP
  !insertmacro _<= $_LOGICLIB_TEMP `${_b}` `${_t}` `${_f}`
!macroend
!define AtMostServicePack `"" AtMostServicePack`

!macro _IsServicePack _a _b _t _f
  !insertmacro _LOGICLIB_TEMP
  ${WinVerGetServicePackLevel} $_LOGICLIB_TEMP
  !insertmacro _= $_LOGICLIB_TEMP `${_b}` `${_t}` `${_f}`
!macroend
!define IsServicePack `"" IsServicePack`

# special feature LogicLib macros

!macro _WinVer_SysMetricCheck m _b _t _f
  !insertmacro _LOGICLIB_TEMP
  System::Call user32::GetSystemMetrics(i${m})i.s
  pop $_LOGICLIB_TEMP
  !insertmacro _!= $_LOGICLIB_TEMP 0 `${_t}` `${_f}`
!macroend

!define IsWin2003R2        `${SM_SERVERR2}    WinVer_SysMetricCheck ""`
!define IsStarterEdition   `${SM_STARTER}     WinVer_SysMetricCheck ""`
!define OSHasMediaCenter   `${SM_MEDIACENTER} WinVer_SysMetricCheck ""`
!define OSHasTabletSupport `${SM_TABLETPC}    WinVer_SysMetricCheck ""`

# version retrieval macros

!macro __WinVer_GetVer var rshift mask outvar
  ${CallArtificialFunction} __WinVer_InitVars
  !if "${mask}" != ""
    IntOp ${outvar} ${var} & ${mask}
    !if "${rshift}" != ""
      IntOp ${outvar} ${outvar} >> ${rshift}
    !endif
  !else
    IntOp ${outvar} ${var} >> ${rshift}
  !endif
!macroend

!define WinVerGetMajor '!insertmacro __WinVer_GetVer $__WINVERV  24 ${_WINVER_MASKVMAJ}'
!define WinVerGetMinor '!insertmacro __WinVer_GetVer $__WINVERV  16 ${_WINVER_MASKVMIN}'
!define WinVerGetBuild '!insertmacro __WinVer_GetVer $__WINVERSP "" ${_WINVER_MASKVBLD}'

# done

!endif # !___WINVER__NSH___

!verbose pop
