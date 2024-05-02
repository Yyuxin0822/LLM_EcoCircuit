import os
import tempfile

import pytest
from flask import g
from flaskr import create_app
from flaskr.db import get_db, init_db
with open(os.path.join(os.path.dirname(__file__), 'data.sql'), 'rb') as f:
    _data_sql = f.read().decode('utf8')

@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp()

    app = create_app({
        'TESTING': True,
        'DATABASE': db_path,
        'LOGIN_DISABLED': True,
    })
    
    with app.app_context():
        init_db()
        get_db().executescript(_data_sql)
    yield app


    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


@pytest.fixture
def pre_test_client(app):
    # Set up an application context and provide a pre-configured test client
    with app.test_client() as test_client:
        with app.app_context():
            yield test_client

@pytest.fixture
def modify_g(pre_test_client):
    # Directly modify the global `g` to include a user
    g.user = {'id': 1, 'username': 'testuser'}  # Assuming a dictionary format for user
    yield
