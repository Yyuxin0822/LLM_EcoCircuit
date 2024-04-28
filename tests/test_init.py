import pytest
from flask import Flask
from flaskr.project import *
from flaskr.db import *
import json
import os
import warnings


# # Path: App_240327/instance/flaskr.sqlite
# db_path = os.path.join(os.path.dirname(__file__), "..", "instance", "flaskr.sqlite")
# db_path = os.path.abspath(db_path)
# print(db_path)


def test_request_example(client):
    response = client.get('/hello')
    assert response.data == b'Hello, World!'

if __name__ == "__main__":
    pytest.main(['test_init.py'])
