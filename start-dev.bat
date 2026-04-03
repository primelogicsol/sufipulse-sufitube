@echo off
echo Cleaning up previous processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM next.exe /T 2>nul

echo Cleaning build cache...
if exist .next rmdir /s /q .next

echo Starting development server...
npm run dev