@echo off
cd /d "%~dp0"
echo === Removing old .git if exists ===
if exist .git rmdir /s /q .git
echo === Initializing fresh git repo ===
git init -b main
echo === Adding all files ===
git add -A
echo === Committing ===
git commit -m "Initial commit: Trailmind MVP - React + Vite + Tailwind"
echo === Setting remote ===
git remote add origin https://github.com/gauravarora9999/trailmind.git
echo === Pushing to GitHub ===
git push -u origin main
echo.
echo === DONE ===
echo Check: https://github.com/gauravarora9999/trailmind
echo.
pause
