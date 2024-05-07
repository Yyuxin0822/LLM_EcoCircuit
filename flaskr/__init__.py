import os

from flask import Flask, abort, flash, session, request, redirect, url_for
from flask_socketio import SocketIO, emit
from flask_cors import CORS  


socketio = SocketIO(cors_allowed_origins=['http://localhost:5000', 'http://127.0.0.1:5000','https://www.ecocircuitai.com'])  # Allow all origins for SocketIO

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    if test_config:
        app.config.update(test_config)
        
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )
    
    # Apply CORS to your Flask app with support for all origins
    CORS(app, supports_credentials=True)  # Enable CORS for all routes
    socketio.init_app(app)
    
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    @app.route('/hello')
    def hello():
        return 'Hello, World!'


    @app.before_request
    def store_prev_url():
        session['prev_url'] = request.url
        
    # Handling 400 error (Bad Request)
    @app.errorhandler(400)
    def bad_request(error):
        # Redirecting back to the previous page
        if session.get('prev_url') == request.url:
            return redirect(url_for('index'))  # Redirect to homepage if current and prev URLs match
        return redirect(session.get('prev_url', url_for('index')))
    
    
    @app.errorhandler(404)
    def bad_request(error):
        # Redirecting back to the previous page
        if session.get('prev_url') == request.url:
            return redirect(url_for('index'))  # Redirect to homepage if current and prev URLs match
        return redirect(session.get('prev_url', url_for('index')))
    
    @app.errorhandler(504)
    def handle_504_error(e):
        flash('The server was timed out. Please try again')
        # Redirect to previous page or to a default one if referrer is not set
        if session.get('prev_url') == request.url:
            return redirect(url_for('index'))  # Redirect to homepage if current and prev URLs match
        return redirect(session.get('prev_url', url_for('index')))


    @app.route('/some_long_running_process')
    def some_long_running_process():
        # Simulate a process that might cause a timeout
        # This is just a placeholder logic
        return abort(504)

    from . import db
    db.init_app(app)

    from . import auth
    app.register_blueprint(auth.bp)

    from . import project
    app.register_blueprint(project.bp)
    app.add_url_rule('/', endpoint='index')

    return app
