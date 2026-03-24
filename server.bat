@echo off
REM Start the Python Flask (or FastAPI) server for the smart_school_system
REM Assumes virtual environment is in .venv and main app is app.py

call .venv\Scripts\activate.bat
python app.py
