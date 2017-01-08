@ECHO OFF
set "APK_ARM_DEBUG=com.marciot.mazewar_vr-0.1-debug.armeabi-v7a.apk"
set "APK_X86_DEBUG=com.marciot.mazewar_vr-0.1-debug.x86.apk"

set "scriptDir=%cd%"
pushd ..

IF "%1"=="build"   GOTO :BUILD
IF "%1"=="install" GOTO :INSTALL
GOTO :HELP

:HELP
ECHO.
ECHO Usage: build-crosswalk.bat [build^|install]
ECHO.
ECHO   build   - Builds crosswalk APK
ECHO   install - Install ARM APK to device using "adb"
EXIT /B

:BUILD
ECHO Building %scriptDir%
del %APK_ARM_DEBUG%
crosswalk-pkg "%scriptDir%"
GOTO :EXIT

:INSTALL
adb install -r %APK_ARM_DEBUG%

:EXIT
popd
