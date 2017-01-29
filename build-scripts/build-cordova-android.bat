@ECHO OFF
set "APK_PREFIX_ORIG=android"
set "APK_PREFIX=com.marciot.mazewar_vr_free-0.1.4"
set "APK_SIGNING_KEY=mazewar-vr-store-assets/mazewar-vr-release-key.jks"
set "APK_ARM=armv7"
set "APK_X86=x86"

set "scriptDir=%cd%"
pushd ..
set "srcDir=%cd%"
pushd ..
set "topDir=%cd%"
set "dstDir=%cd%\mazewar-vr-cordova-android"

IF "%1"=="build"           GOTO :BUILD
IF "%1"=="build-release"   GOTO :BUILD_RELEASE
IF "%1"=="sign-release"    GOTO :SIGN_RELEASE
GOTO :HELP

:HELP
ECHO.
ECHO Usage: build-cordova-android.bat [build^|build-release]
ECHO.
ECHO   build           - Builds cordova APK
ECHO   build-release   - Builds cordova APK
ECHO   sign-release    - Sign the APK files for distribution
EXIT /B

:PREPARE
ECHO Copying from "%srcDir%" to "%dstDir%"
rmdir /q /s "%dstDir%"
mkdir "%dstDir%"
mkdir "%dstDir%\www"
copy "%scriptDir%\config-cordova-android.xml" "%dstDir%\config.xml"
copy "%srcDir%\cordova.html"     "%dstDir%\www\cordova.html"
xcopy /s /i "%srcDir%\artwork"   "%dstDir%\www\artwork"
xcopy /s /i "%srcDir%\extras"    "%dstDir%\www\extras"
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

:SIGN_RELEASE
cd "%dstDir%\platforms\android\build\outputs\apk"
ren "%APK_PREFIX_ORIG%-%APK_ARM%-release-unsigned.apk" "%APK_PREFIX%-%APK_ARM%-release-unsigned.apk"
ren "%APK_PREFIX_ORIG%-%APK_X86%-release-unsigned.apk" "%APK_PREFIX%-%APK_X86%-release-unsigned.apk"
zipalign -v -p 4 %APK_PREFIX%-%APK_ARM%-release-unsigned.apk %APK_PREFIX%-%APK_ARM%-release-unsigned-aligned.apk
zipalign -v -p 4 %APK_PREFIX%-%APK_X86%-release-unsigned.apk %APK_PREFIX%-%APK_X86%-release-unsigned-aligned.apk
call apksigner sign --ks "%topDir%\%APK_SIGNING_KEY%" --out %APK_PREFIX%-%APK_ARM%-release.apk %APK_PREFIX%-%APK_ARM%-release-unsigned-aligned.apk
call apksigner sign --ks "%topDir%\%APK_SIGNING_KEY%" --out %APK_PREFIX%-%APK_X86%-release.apk %APK_PREFIX%-%APK_X86%-release-unsigned-aligned.apk
GOTO :EXIT

:EXIT
popd
