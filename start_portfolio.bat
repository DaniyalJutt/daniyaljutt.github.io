@echo off
title Daniyal Atta - AI Portfolio
echo ============================================================
echo Starting Daniyal Atta AI Portfolio Website...
echo ============================================================
echo Opening http://localhost:8080 in default browser...
start "" "http://localhost:8080"
python -m http.server 8080
pause
