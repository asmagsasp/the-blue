@echo off
title The Blue - Local Server
echo Verificando dependencias...
if not exist node_modules (
    echo Instalando servidor local (aguarde)...
    call npm install
)
echo.
echo ========================================
echo   THE BLUE - SERVIDOR LOCAL ATIVO
echo ========================================
echo.
echo Acesse: http://localhost:3000
echo.
npm start
pause
