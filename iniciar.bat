@echo off
title Mensajes Predefinidos
cd /d "%~dp0"

echo.
echo  ========================================
echo   Mensajes Predefinidos - localhost:3000
echo  ========================================
echo.

:: Verificar que Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no encontrado. Instalalo desde https://nodejs.org
    pause
    exit /b 1
)

:: Instalar dependencias si no existen
if not exist "node_modules" (
    echo  Instalando dependencias...
    npm install
    echo.
)

:: Abrir el navegador con un pequeño delay
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Iniciar el servidor
echo  Servidor iniciando en http://localhost:3000
echo  Presiona Ctrl+C para detener el servidor.
echo.
npm start
