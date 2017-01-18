@ECHO OFF
set "APK_PREFIX=com.marciot.mazewar_vr_free-0.1.1"
set "APK_SIGNING_KEY=mazewar-vr-store-assets/mazewar-vr-release-key.jks"
set "APK_ARM=armeabi-v7a.apk"
set "APK_X86=x86.apk"

set "scriptDir=%cd%"
pushd ..
set "srcDir=%cd%"
pushd ..
set "dstDir=%cd%\mazewar-vr-cordova-android"

IF "%1"=="build"           GOTO :BUILD
IF "%1"=="build-release"   GOTO :BUILD_RELEASE
GOTO :HELP

:HELP
ECHO.
ECHO Usage: build-cordova-android.bat [build^|build-release]
ECHO.
ECHO   build           - Builds cordova APK
ECHO   build-release   - Builds cordova APK
EXIT /B

:PREPARE
ECHO Copying from "%srcDir%" to "%dstDir%"
rmdir /q /s "%dstDir%"
mkdir "%dstDir%"
mkdir "%dstDir%\www"
copy "%scriptDir%\config-cordova-android.xml" "%dstDir%\config.xml"
copy "%srcDir%\cordova.html"     "%dstDir%\www\cordova.html"
xcopy /s /i "%srcDir%\artwork"   "%dstDir%\www\artwork"
xcopy /s /i "%srcDir%\extras"    "%dstDir%\www\extra"
xcopy /s /i "%srcDir%\js"        "%dstDir%\www\js"
xcopy /s /i "%srcDir%\private"   "%dstDir%\www\private"
xcopy /s /i "%srcDir%\sounds"    "%dstDir%\www\sounds"
xcopy /s /i "%srcDir%\textures"  "%dstDir%\www\textures"
cd "%dstDir%"
call cordova prepare
GOTO :EXIT

:BUILD
CALL :PREPARE
ECHO Building "%dstDir%"
cd "%dstDir%"
call cordova build android
GOTO :EXIT

:BUILD_RELEASE
CALL :PREPARE
ECHO Building "%dstDir%"
cd "%dstDir%"
call cordova build android --release
GOTO :EXIT

:EXIT
popd
