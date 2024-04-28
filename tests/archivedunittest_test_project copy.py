import unittest
from flask import Flask
from flaskr.project import *
from flaskr.db import *
import json
import os

# Path: App_240327/instance/flaskr.sqlite
db_path = os.path.join(os.path.dirname(__file__), "..", "instance", "flaskr.sqlite")
db_path = os.path.abspath(db_path)
print(db_path)


class FlaskTestCase(unittest.TestCase):
    def setUp(self):
        # Set up the Flask application
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True  # Enable testing mode
        self.app.config["DATABASE"] = db_path
        # Establish an application context before each test
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        # Pop the application context after each test
        self.ctx.pop()

    def test_genio_from_description(self):
        assert "TESTING" in self.app.config
        assert self.app.config["TESTING"] == True
        prompt_id = genio_from_description(7, 1, "This is a coastal environment")
        prompt_dict = get_prompt(prompt_id)
        print(prompt_dict)
        self.assertIsInstance(prompt_dict["node"], dict)
        self.assertIsInstance(prompt_dict["flow"], list)

    def test_get_prompt(self):
        # Example test that now has access to application context
        assert "TESTING" in self.app.config
        assert self.app.config["TESTING"] == True
        prompt_id = 1
        prompt = get_prompt(prompt_id)
        query = prompt["flow"][0]
        expected_query = ["SEA BREEZE", "NATURAL COOLING"]

        # Using unittest's assertions for better integration and reporting
        self.assertIsInstance(prompt["id"], int)
        self.assertIsInstance(prompt["flow"], list)
        self.assertIsInstance(prompt["flow"][0], list)
        self.assertIsInstance(prompt["node"], dict)
        self.assertIsInstance(prompt["node"]["SEA BREEZE"], list)
        self.assertIsInstance(prompt["system"], dict)
        self.assertIsInstance(prompt["project_id"], int)
        self.assertEqual(query, expected_query)

    def test_get_max_prompt_id(self):
        pass
        # Example test that now has access to application context
        # assert "TESTING" in self.app.config
        # assert self.app.config["TESTING"] == True
        # #initiate database
        # with self.app.app_context():
        #     init_db()
        # max_id = get_max_prompt_id()
        # self.assertEqual(max_id, 0)

    def test_update(self):
        # Example test that now has access to application context
        assert "TESTING" in self.app.config
        assert self.app.config["TESTING"] == True
        prompt_id = genio_from_description(9, 1, "This is a coastal environment")
        prompt_before_result1=get_prompt(9)
        data1 = {
            "mode": "add-input",
            "prompt_id_array": ["prompt9"],
            "info_array": [prompt_before_result1["flow"][0]],
            "currentmatrix_array": [prompt_before_result1["node"]],
        }
        self.assertIsInstance(data1["info_array"], list)
        print(prompt_before_result1)
        
        
        result1 = update(data1["mode"], data1["prompt_id_array"], data1["info_array"], data1["currentmatrix_array"])
        prompt_after_result1=get_prompt(9)
        self.assertEqual(result1,[9])
        self.assertIsInstance(prompt_before_result1['node'], dict)
        print(prompt_after_result1)
        self.assertIsNotNone(prompt_before_result1['node'])
        self.assertIsNotNone(prompt_after_result1['flow'][0])
        self.assertNotEqual(prompt_before_result1['node'],prompt_after_result1['node'])


if __name__ == "__main__":
    unittest.main()
