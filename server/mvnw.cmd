@echo off
set MAVEN_PROJECTBASEDIR=%~dp0
if exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" (
    java -classpath "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" "org.apache.maven.wrapper.MavenWrapperMain" %*
) else (
    mvn %*
)

