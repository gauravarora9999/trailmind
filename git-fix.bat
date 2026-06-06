@echo off
cd /d "C:\Users\gaura\OneDrive\Documents(1)\Claude\Projects\Hackathon\trailmind"
echo === Fix Push Log === > "..\git-fix-log.txt"
git add -A >> "..\git-fix-log.txt" 2>&1
git commit -m "fix: guard money() against null values from Supabase" >> "..\git-fix-log.txt" 2>&1
git push origin main >> "..\git-fix-log.txt" 2>&1
echo. >> "..\git-fix-log.txt"
git status >> "..\git-fix-log.txt" 2>&1
echo DONE >> "..\git-fix-log.txt"
