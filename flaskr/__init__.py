import os

from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS  


socketio = SocketIO(cors_allowed_origins="*")  # Allow all origins for SocketIO

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





    from . import db
    db.init_app(app)

    from . import auth
    app.register_blueprint(auth.bp)

    from . import project
    app.register_blueprint(project.bp)
    app.add_url_rule('/', endpoint='index')

    return app
