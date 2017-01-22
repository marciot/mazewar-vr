@ECHO OFF
set "APK_PREFIX=com.marciot.mazewar_vr_free-0.1.1"
set "APK_SIGNING_KEY=mazewar-vr-store-assets/mazewar-vr-release-key.jks"
set "APK_ARM=armeabi-v7a.apk"
set "APK_X86=x86.apk"

set "scriptDir=%cd%"
pushd ..
set "srcDir=%cd%"
pushd ..
set "dstDir=%cd%\mazewar-vr-crosswalk-android"

IF "%1"=="build"           GOTO :BUILD
IF "%1"=="build-release"   GOTO :BUILD_RELEASE
IF "%1"=="install"         GOTO :INSTALL
IF "%1"=="install-release" GOTO :INSTALL_RELEASE
IF "%1"=="sign-release"    GOTO :SIGN_RELEASE
IF "%1"=="clean"           GOTO :CLEAN
GOTO :HELP

:HELP
ECHO.
ECHO Usage: build-crosswalk.bat [build^|install]
ECHO.
ECHO   build           - Builds crosswalk APK
ECHO   build-release   - Builds crosswalk APK
ECHO   install         - Install ARM APK to device using "adb"
ECHO   install-release - Install ARM APK to device using "adb"
ECHO   sign-release    - Sign the APK files for distribution
ECHO   clean           - Delete all built APKs
EXIT /B

:BUILD
ECHO Building %srcDir%
del %APK_PREFIX%-debug.%APK_ARM%
del %APK_PREFIX%-debug.%APK_X86%
crosswalk-pkg "%srcDir%"
GOTO :EXIT

:BUILD_RELEASE
ECHO Building release for %scriptDir%
crosswalk-pkg --release "%scriptDir%"
GOTO :EXIT

:SIGN_RELEASE
zipalign -v -p 4 %APK_PREFIX%-release-unsigned.%APK_ARM% %APK_PREFIX%-release-unsigned-aligned.%APK_ARM%
zipalign -v -p 4 %APK_PREFIX%-release-unsigned.%APK_X86% %APK_PREFIX%-release-unsigned-aligned.%APK_X86%
apksigner sign --ks %APK_SIGNING_KEY% --out %APK_PREFIX%-release.%APK_ARM% %APK_PREFIX%-release-unsigned-aligned.%APK_ARM%
apksigner sign --ks %APK_SIGNING_KEY% --out %APK_PREFIX%-release.%APK_X86% %APK_PREFIX%-release-unsigned-aligned.%APK_X86%
GOTO :EXIT

:INSTALL
adb install -r %APK_PREFIX%-debug.%APK_ARM%
GOTO :EXIT

:INSTALL_RELEASE
adb install -r %APK_PREFIX%-release.%APK_ARM%
GOTO :EXIT

:CLEAN
del %APK_PREFIX%-release.%APK_ARM%
del %APK_PREFIX%-release.%APK_X86%
del %APK_PREFIX%-release-unsigned.%APK_ARM%
del %APK_PREFIX%-release-unsigned.%APK_X86%
del %APK_PREFIX%-release-unsigned-aligned.%APK_ARM%
del %APK_PREFIX%-release-unsigned-aligned.%APK_X86%

:EXIT
popd
