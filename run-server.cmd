@echo off
setlocal
call "%~dp0server\mvnw.cmd" -f "%~dp0server\pom.xml" spring-boot:run %*
