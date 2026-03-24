from flask import Flask, session, redirect, url_for
import os

app = Flask(__name__)
app.secret_key = 'test_key'

@app.route('/test_session')
def test_session():
    session['test'] = 'value'
    return f"Session set: {dict(session)}"

@app.route('/check_session')
def check_session():
    return f"Session contents: {dict(session)}"

if __name__ == '__main__':
    app.run(debug=True, port=5001)