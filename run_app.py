#!/usr/bin/env python
"""
Smart School Management System
Run Script
"""

import os
import sys
from app import app

if __name__ == "__main__":
    print("Starting Smart School Management System...")
    print("Visit http://localhost:5000 in your browser")
    print("Press Ctrl+C to stop the server")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\nShutting down the server...")
        sys.exit(0)