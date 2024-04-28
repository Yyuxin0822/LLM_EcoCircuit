import pytest
from flask import Flask
from flaskr.project import *
from flaskr.db import *
import json
import os
import logging

logging.basicConfig(
    level=logging.DEBUG,
    filename="test_logs_project.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
)


# Path: App_240327/instance/flaskr.sqlite
db_path = os.path.join(os.path.dirname(__file__), "..", "instance", "flaskr.sqlite")
db_path = os.path.abspath(db_path)
print(db_path)


class TestCustomProjectResponse:
    @pytest.fixture(autouse=True)
    def set_up(self, app):
        """Setup that requires app context."""
        #with app.app_context():
           # genio_from_description(1, 1, "This is a coastal environment")
           
    @pytest.mark.skip(reason="no way of currently testing this")
    def test_save_to_custom(self, app, client):
        with app.app_context():
            project_id = 1
            response = client.post(
                "/savetocustom",
                data=json.dumps({
                    "project_id": "1",
                    "prompt_id_array": ["prompt1"],
                }),
                content_type="application/json",
            )
            data = json.loads(response.data)
            assert data["status"] == "success"
            assert data["data"]["project_id"] == str(project_id)

    def test_save_to_custom(self, app, client):
        with app.app_context():
            project_id = 1
            response = client.post(
                "/savetocustom",
                data=json.dumps(
                    {
                        "currentmatrix_array": [
                            {
                                "ACCESSIBILITY": [
                                    [1160, 216],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "AESTHETICS": [
                                    [1160, 240],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "AREA DEMARCATION": [
                                    [1160, 264],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "ART-DECO BUILDINGS": [
                                    [80, 240],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "BENCHES": [[80, 264], "", "rgba(136, 136, 136, 0.75)"],
                                "BICYCLE RACKS": [
                                    [80, 720],
                                    "",
                                    "rgba(255, 68, 68, 0.75)",
                                ],
                                "BIRDS": [[80, 48], "", "rgba(51, 204, 68, 0.75)"],
                                "BLOOMING FLOWERS": [
                                    [80, 72],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "CARBON SEQUESTRATION": [
                                    [1160, 0],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "CARBON STORAGE": [
                                    [1160, 24],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "COMPOST": [[80, 600], "", "rgba(170, 119, 85, 0.75)"],
                                "CONVENIENCE": [
                                    [1160, 288],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "COOLING": [[1160, 696], "", "rgba(255, 204, 0, 0.75)"],
                                "CULTURAL EXPRESSION": [
                                    [1160, 312],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "DRINKING FOUNTAINS": [
                                    [80, 288],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "DUST CONTROL": [
                                    [1160, 48],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "ELECTRICITY": [
                                    [80, 792],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "ENTERTAINMENT": [
                                    [1160, 336],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "EXERCISE": [
                                    [1160, 360],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "FENCING": [[80, 312], "", "rgba(136, 136, 136, 0.75)"],
                                "FITNESS": [
                                    [1160, 384],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "FOOD STANDS": [
                                    [80, 336],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "GRASS": [[80, 96], "", "rgba(51, 204, 68, 0.75)"],
                                "HABITAT": [[1160, 72], "", "rgba(51, 204, 68, 0.75)"],
                                "HORTICULTURAL WASTE": [
                                    [80, 624],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "ICE (WINTER)": [
                                    [80, 0],
                                    "",
                                    "rgba(0, 187, 255, 0.75)",
                                ],
                                "INCLUSION": [
                                    [1160, 408],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "INFORMATION ACCESS": [
                                    [1160, 576],
                                    "",
                                    "rgba(153, 85, 170, 0.75)",
                                ],
                                "INSECTS": [[80, 120], "", "rgba(51, 204, 68, 0.75)"],
                                "IRRIGATION SYSTEM": [
                                    [80, 24],
                                    "",
                                    "rgba(0, 187, 255, 0.75)",
                                ],
                                "LAMP POSTS": [
                                    [80, 816],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "LANDSCAPE PRESERVATION": [
                                    [1160, 96],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "LEISURE": [
                                    [1160, 432],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "LIGHTING": [
                                    [1160, 720],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "LIGHTING FIXTURES": [
                                    [80, 840],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "LITTER BINS": [
                                    [80, 648],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "MAINTENANCE TOOLS": [
                                    [80, 360],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "MULCH": [[1160, 600], "", "rgba(170, 119, 85, 0.75)"],
                                "NATURAL PEST CONTROL": [
                                    [1160, 120],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "NATURAL SEED DISPERSAL": [
                                    [1160, 144],
                                    "",
                                    "rgba(51, 204, 68, 0.75)",
                                ],
                                "NECTAR": [[1160, 168], "", "rgba(51, 204, 68, 0.75)"],
                                "ORIENTATION": [
                                    [1160, 456],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "OXYGEN": [[1160, 192], "", "rgba(51, 204, 68, 0.75)"],
                                "PARK SIGNAGE": [
                                    [80, 384],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "PEDESTRIAN PATHWAYS": [
                                    [80, 744],
                                    "",
                                    "rgba(255, 68, 68, 0.75)",
                                ],
                                "PICNIC TABLES": [
                                    [80, 408],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "PLAYGROUND MATERIALS": [
                                    [80, 432],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "POTENTIAL RECYCLED MATERIALS": [
                                    [1160, 624],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "PUBLIC ART INSTALLATIONS": [
                                    [80, 456],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "PUBLIC TRANSIT ACCESS": [
                                    [80, 768],
                                    "",
                                    "rgba(255, 68, 68, 0.75)",
                                ],
                                "READING MATERIALS": [
                                    [80, 480],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "RECYCLABLE ITEMS": [
                                    [80, 672],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "RECYCLE SUBSTANCE": [
                                    [1160, 648],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "REDUCED FOSSIL FUEL USAGE": [
                                    [1160, 744],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "SCULPTURES": [
                                    [80, 504],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "SECURITY": [
                                    [1160, 480],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "SHRUBS": [[80, 144], "", "rgba(51, 204, 68, 0.75)"],
                                "SOCIAL INTERACTION": [
                                    [1160, 504],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "SOCIAL INTERACTION AREA": [
                                    [1160, 528],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "SOIL": [[80, 168], "", "rgba(51, 204, 68, 0.75)"],
                                "SOLAR POWER": [
                                    [80, 864],
                                    "",
                                    "rgba(255, 204, 0, 0.75)",
                                ],
                                "SQUIRRELS": [[80, 192], "", "rgba(51, 204, 68, 0.75)"],
                                "TOURIST ATTRACTION": [
                                    [1160, 552],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "TRASH": [[80, 696], "", "rgba(170, 119, 85, 0.75)"],
                                "TREES": [[80, 216], "", "rgba(51, 204, 68, 0.75)"],
                                "WASTE REDUCTION": [
                                    [1160, 672],
                                    "",
                                    "rgba(170, 119, 85, 0.75)",
                                ],
                                "WHEELCHAIR ACCESS RAMPS": [
                                    [80, 528],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                                "WIFI NETWORK": [
                                    [80, 576],
                                    "",
                                    "rgba(153, 85, 170, 0.75)",
                                ],
                                "YOGA MATS": [
                                    [80, 552],
                                    "",
                                    "rgba(136, 136, 136, 0.75)",
                                ],
                            }
                        ],
                        "info_array": [
                            [
                                "SOIL",
                                "SQUIRRELS",
                                "BENCHES",
                                "PICNIC TABLES",
                                "RECYCLABLE ITEMS",
                                "ACCESSIBILITY",
                                ["INSECTS", "NATURAL PEST CONTROL"],
                            ]
                        ],
                        "project_id": "1",
                        "prompt_id_array": ["prompt1"],
                    }
                ),
                content_type="application/json",
            )
            data = json.loads(response.data)
            assert data["status"] == "success"
            assert data["data"]["project_id"] == str(project_id)
            
            project_id = int(data["data"]["project_id"])
            prompt_id = data["data"]["prompt_id_array"]
            query_array = data["data"]["info_array"]
            currentmatrix = data["data"]["currentmatrix_array"]
    
            customprompt_id=updatecustom(project_id, prompt_id, query_array, currentmatrix)
            prompt=get_customprompt(customprompt_id)
            logging.debug(f'customprompt_id: {customprompt_id}')
            logging.debug(f"Custom Prompt: {prompt}")
            project=get_customproject(project_id, False)
            logging.debug(f"Project: {project}")

def test_getcustomproject(app):
    with app.app_context():
        genio_from_description(1, 1, "This is a coastal environment")
        project_id = 1
        project = get_customproject(project_id, False)
        assert isinstance(project, dict)
        assert project["id"] == project_id
        assert isinstance(project["prompt"], dict)
        assert isinstance(project["prompt"]["node"], dict)
        assert isinstance(project["prompt"]["flow"], list)
        assert isinstance(project["prompt"]["flow"][0], list)
        assert isinstance(project["prompt"]["system"], dict)
        assert isinstance(project["prompt"]["project_id"], int)


def test_genio_from_description(app):
    with app.app_context():
        prompt_id = genio_from_description(7, 1, "This is a coastal environment")
        prompt_dict = get_prompt(prompt_id)
        assert isinstance(prompt_dict["node"], dict)
        assert isinstance(prompt_dict["flow"], list)

        logging.debug(f"Prompt dictionary: {prompt_dict}")


def test_get_customprompt_id(app):
    with app.app_context():
        project_id = 1
        customprompt_id = get_customprompt_id(project_id)
        assert isinstance(customprompt_id, int)
        assert customprompt_id > 0
        
        project_id = 2
        customprompt_id = get_customprompt_id(project_id)
        assert customprompt_id >0
# @pytest.mark.skip(reason="no way of currently testing this")
# def test_get_prompt(self):
#     # Example test that now has access to application context
#     assert "TESTING" in self.app.config
#     assert self.app.config["TESTING"] == True
#     prompt_id = 1
#     prompt = get_prompt(prompt_id)
#     query = prompt["flow"][0]
#     expected_query = ["SEA BREEZE", "NATURAL COOLING"]

#     # Using unittest's assertions for better integration and reporting
#     self.assertIsInstance(prompt["id"], int)
#     self.assertIsInstance(prompt["flow"], list)
#     self.assertIsInstance(prompt["flow"][0], list)
#     self.assertIsInstance(prompt["node"], dict)
#     self.assertIsInstance(prompt["node"]["SEA BREEZE"], list)
#     self.assertIsInstance(prompt["system"], dict)
#     self.assertIsInstance(prompt["project_id"], int)
#     self.assertEqual(query, expected_query)

# @pytest.mark.skip(reason="no way of currently testing this")
# def test_get_max_prompt_id(self):
#     pass
#     # Example test that now has access to application context
#     # assert "TESTING" in self.app.config
#     # assert self.app.config["TESTING"] == True
#     # #initiate database
#     # with self.app.app_context():
#     #     init_db()
#     # max_id = get_max_prompt_id()
#     # self.assertEqual(max_id, 0)

def test_update(app):
    with app.app_context():
        # Example test that now has access to application context
        prompt_id = genio_from_description(9, 1, "This is a coastal environment")
        prompt_before_result1 = get_prompt(9)
        data1 = {
            "mode": "add-input",
            "prompt_id_array": ["prompt9"],
            "info_array": [prompt_before_result1["flow"][0]],
            "currentmatrix_array": [prompt_before_result1["node"]],
        }
        assert isinstance(data1["info_array"], list)
        logging.debug(f"{prompt_before_result1}")

        result_id = update(data1["mode"], data1["prompt_id_array"], data1["info_array"])
        prompt_after_result1 = get_prompt(result_id)
        logging.debug(f"{prompt_after_result1}")
        assert isinstance(prompt_after_result1["node"], dict)
        assert isinstance(prompt_after_result1["flow"][0], list)


def test_updatecustom(app):
    with app.app_context():
        data = {
            "currentmatrix_array": [
                {
                    "ACCESSIBILITY": [[1160, 216], "", "rgba(136, 136, 136, 0.75)"],
                    "AESTHETICS": [[1160, 240], "", "rgba(136, 136, 136, 0.75)"],
                    "AREA DEMARCATION": [[1160, 264], "", "rgba(136, 136, 136, 0.75)"],
                    "ART-DECO BUILDINGS": [[80, 240], "", "rgba(136, 136, 136, 0.75)"],
                    "BENCHES": [[80, 264], "", "rgba(136, 136, 136, 0.75)"],
                    "BICYCLE RACKS": [[80, 720], "", "rgba(255, 68, 68, 0.75)"],
                    "BIRDS": [[80, 48], "", "rgba(51, 204, 68, 0.75)"],
                    "BLOOMING FLOWERS": [[80, 72], "", "rgba(51, 204, 68, 0.75)"],
                    "CARBON SEQUESTRATION": [[1160, 0], "", "rgba(51, 204, 68, 0.75)"],
                    "CARBON STORAGE": [[1160, 24], "", "rgba(51, 204, 68, 0.75)"],
                    "COMPOST": [[80, 600], "", "rgba(170, 119, 85, 0.75)"],
                    "CONVENIENCE": [[1160, 288], "", "rgba(136, 136, 136, 0.75)"],
                    "COOLING": [[1160, 696], "", "rgba(255, 204, 0, 0.75)"],
                    "CULTURAL EXPRESSION": [
                        [1160, 312],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "DRINKING FOUNTAINS": [[80, 288], "", "rgba(136, 136, 136, 0.75)"],
                    "DUST CONTROL": [[1160, 48], "", "rgba(51, 204, 68, 0.75)"],
                    "ELECTRICITY": [[80, 792], "", "rgba(255, 204, 0, 0.75)"],
                    "ENTERTAINMENT": [[1160, 336], "", "rgba(136, 136, 136, 0.75)"],
                    "EXERCISE": [[1160, 360], "", "rgba(136, 136, 136, 0.75)"],
                    "FENCING": [[80, 312], "", "rgba(136, 136, 136, 0.75)"],
                    "FITNESS": [[1160, 384], "", "rgba(136, 136, 136, 0.75)"],
                    "FOOD STANDS": [[80, 336], "", "rgba(136, 136, 136, 0.75)"],
                    "GRASS": [[80, 96], "", "rgba(51, 204, 68, 0.75)"],
                    "HABITAT": [[1160, 72], "", "rgba(51, 204, 68, 0.75)"],
                    "HORTICULTURAL WASTE": [[80, 624], "", "rgba(170, 119, 85, 0.75)"],
                    "ICE (WINTER)": [[80, 0], "", "rgba(0, 187, 255, 0.75)"],
                    "INCLUSION": [[1160, 408], "", "rgba(136, 136, 136, 0.75)"],
                    "INFORMATION ACCESS": [[1160, 576], "", "rgba(153, 85, 170, 0.75)"],
                    "INSECTS": [[80, 120], "", "rgba(51, 204, 68, 0.75)"],
                    "IRRIGATION SYSTEM": [[80, 24], "", "rgba(0, 187, 255, 0.75)"],
                    "LAMP POSTS": [[80, 816], "", "rgba(255, 204, 0, 0.75)"],
                    "LANDSCAPE PRESERVATION": [
                        [1160, 96],
                        "",
                        "rgba(51, 204, 68, 0.75)",
                    ],
                    "LEISURE": [[1160, 432], "", "rgba(136, 136, 136, 0.75)"],
                    "LIGHTING": [[1160, 720], "", "rgba(255, 204, 0, 0.75)"],
                    "LIGHTING FIXTURES": [[80, 840], "", "rgba(255, 204, 0, 0.75)"],
                    "LITTER BINS": [[80, 648], "", "rgba(170, 119, 85, 0.75)"],
                    "MAINTENANCE TOOLS": [[80, 360], "", "rgba(136, 136, 136, 0.75)"],
                    "MULCH": [[1160, 600], "", "rgba(170, 119, 85, 0.75)"],
                    "NATURAL PEST CONTROL": [
                        [1160, 120],
                        "",
                        "rgba(51, 204, 68, 0.75)",
                    ],
                    "NATURAL SEED DISPERSAL": [
                        [1160, 144],
                        "",
                        "rgba(51, 204, 68, 0.75)",
                    ],
                    "NECTAR": [[1160, 168], "", "rgba(51, 204, 68, 0.75)"],
                    "ORIENTATION": [[1160, 456], "", "rgba(136, 136, 136, 0.75)"],
                    "OXYGEN": [[1160, 192], "", "rgba(51, 204, 68, 0.75)"],
                    "PARK SIGNAGE": [[80, 384], "", "rgba(136, 136, 136, 0.75)"],
                    "PEDESTRIAN PATHWAYS": [[80, 744], "", "rgba(255, 68, 68, 0.75)"],
                    "PICNIC TABLES": [[80, 408], "", "rgba(136, 136, 136, 0.75)"],
                    "PLAYGROUND MATERIALS": [
                        [80, 432],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "POTENTIAL RECYCLED MATERIALS": [
                        [1160, 624],
                        "",
                        "rgba(170, 119, 85, 0.75)",
                    ],
                    "PUBLIC ART INSTALLATIONS": [
                        [80, 456],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "PUBLIC TRANSIT ACCESS": [[80, 768], "", "rgba(255, 68, 68, 0.75)"],
                    "READING MATERIALS": [[80, 480], "", "rgba(136, 136, 136, 0.75)"],
                    "RECYCLABLE ITEMS": [[80, 672], "", "rgba(170, 119, 85, 0.75)"],
                    "RECYCLE SUBSTANCE": [[1160, 648], "", "rgba(170, 119, 85, 0.75)"],
                    "REDUCED FOSSIL FUEL USAGE": [
                        [1160, 744],
                        "",
                        "rgba(255, 204, 0, 0.75)",
                    ],
                    "SCULPTURES": [[80, 504], "", "rgba(136, 136, 136, 0.75)"],
                    "SECURITY": [[1160, 480], "", "rgba(136, 136, 136, 0.75)"],
                    "SHRUBS": [[80, 144], "", "rgba(51, 204, 68, 0.75)"],
                    "SOCIAL INTERACTION": [
                        [1160, 504],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "SOCIAL INTERACTION AREA": [
                        [1160, 528],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "SOIL": [[80, 168], "", "rgba(51, 204, 68, 0.75)"],
                    "SOLAR POWER": [[80, 864], "", "rgba(255, 204, 0, 0.75)"],
                    "SQUIRRELS": [[80, 192], "", "rgba(51, 204, 68, 0.75)"],
                    "TOURIST ATTRACTION": [
                        [1160, 552],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "TRASH": [[80, 696], "", "rgba(170, 119, 85, 0.75)"],
                    "TREES": [[80, 216], "", "rgba(51, 204, 68, 0.75)"],
                    "WASTE REDUCTION": [[1160, 672], "", "rgba(170, 119, 85, 0.75)"],
                    "WHEELCHAIR ACCESS RAMPS": [
                        [80, 528],
                        "",
                        "rgba(136, 136, 136, 0.75)",
                    ],
                    "WIFI NETWORK": [[80, 576], "", "rgba(153, 85, 170, 0.75)"],
                    "YOGA MATS": [[80, 552], "", "rgba(136, 136, 136, 0.75)"],
                }
            ],
            "info_array": [["BIRDS", "BLOOMING FLOWERS", ["GRASS", "OXYGEN"]]],
            "project_id": "1",
            "prompt_id_array": ["prompt1"],
        }
        result_id = updatecustom(
            int(data["project_id"]),
            data["prompt_id_array"],
            data["info_array"],
            data["currentmatrix_array"],
        )
        logging.debug(f"Result ID: {result_id}")
        prompt_after_result1 = get_customprompt(result_id)
        logging.debug(f"{prompt_after_result1}")
        assert isinstance(prompt_after_result1["node"], dict)
        assert isinstance(prompt_after_result1["flow"][0], list)


if __name__ == "__main__":
    # pytest.main(['test_project.py'])
    # pytest.main(
    #     [
    #         "test_project.py::test_updatecustom",
    #         "-x",
    #     ]
    # )

    pytest.main(
        [
            "test_project.py::test_get_customprompt_id",
            "-x",
        ]
    )
