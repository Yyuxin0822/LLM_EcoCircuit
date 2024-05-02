import pytest
import time
from flask import Flask
from flaskr.__img import *
from contextlib import redirect_stdout
import os
import json

import logging


logging.basicConfig(
    level=logging.DEBUG,
    filename="test_logs_img.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def test_getcanvas():
    envir_template= f"envision a place with "
    label1 = "SEA BREEZE, NATURAL COOLING"
    image_url1 = getcanvas(envir_template+label1)
    assert image_url1 is not None
    logging.debug(f"Image URL: {image_url1}")
    
    label2 ="SUCCULENTS, WETLAND, NON-POTABLE WATER, WETLAND"
    image_url2 = getcanvas(envir_template+label2)
    assert image_url2 is not None
    logging.debug(f"Image URL: {image_url2}")
    
    label3 = "SOLAR PANELS, WIND TURBINES, WASTEWATER TREATMENT PLANT"


if __name__ == "__main__":
    pytest.main(
        [
            "test_img.py::test_getcanvas",
            "-x",
        ]
    )
