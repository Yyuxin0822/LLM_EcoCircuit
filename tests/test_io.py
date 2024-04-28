import pytest
from flask import Flask
from flaskr.__io import *

import os
import json
# Path: App_240327/instance/flaskr.sqlite
db_path = os.path.join(os.path.dirname(__file__), "..", "instance", "flaskr.sqlite")
db_path = os.path.abspath(db_path)
print(db_path)


def test_return_input(app):
    assert "TESTING" in self.app.config
    assert self.app.config["TESTING"] == True
    result1 = return_input("This is a coastal environment")
    result2= return_input("This is a palace")
    self.assertIsInstance(result1, list)
    self.assertIsInstance(result2, list)

def test_return_io(app):
    input_r1=["sunlight", "water", "soil"]
    result1= return_io(input_r1)
    self.assertIsInstance(result1, list)
    self.assertIsInstance(result1[0], list)      

def test_return_system(app):
    input_r1=["sunlight", "water", "soil"]
    result1= return_system(input_r1)
    self.assertIsInstance(result1, dict)  
    self.assertEqual(input_r1, list(result1.keys()))     
    
    input_r2=["ice cream", "riverfront", "computer"]
    result2= return_system(input_r2)
    self.assertIsInstance(result2, dict)  
    self.assertEqual(input_r2, list(result1.keys()))     
    
if __name__ == "__main__":
    pytest.main(['test_io.py'])