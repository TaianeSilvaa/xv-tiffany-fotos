@echo off
title 15 Anos da Tiffany
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale em https://nodejs.org e tente novamente.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

echo Abrindo o site em http://localhost:5173
start "" http://localhost:5173
call npm run dev
