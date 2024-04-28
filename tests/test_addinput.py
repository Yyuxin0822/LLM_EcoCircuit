import pytest
import time
from flask import Flask
from flaskr.__addinput import *
from flaskr.__io import *
from contextlib import redirect_stdout
import os
import json

import logging

logging.basicConfig(
    level=logging.DEBUG,
    filename="test_logs_addiput.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
)


################test helper functions################
#####################################################
def preview():
    pass
class TestHelperFunctions:
    def test_maplist(self):
        currentx1 = [-1, 2, 3, 4]
        expected1 = [0, 1, 2, 3]
        result1 = maplistx(currentx1)
        assert result1[1] == expected1

        currentx2 = [0, 4, 4.1, 4.2, 4.3, 6]
        expected2 = [0, 1, 1.1, 1.2, 1.3, 2]
        result2 = maplistx(currentx2)
        assert result2[1] == expected2

        currentx3 = [0, 3, 4, 4.1, 4.2, 4.3, 5]
        expected3 = [0, 1, 2, 2.1, 2.2, 2.3, 3]
        result3 = maplistx(currentx3)
        assert result3[1] == expected3

    def test_mapX(self):
        currentx = [-1, -2, 5, 3]
        resut1 = mapX(currentx)
        assert resut1[-2] == 0
        assert resut1[-1] == 1

    def test_refactormatrixy(self):
        currentmatrix = {"x": [[1, 2], "HYDRO"], "y": [[1, 2], "ENERGY"]}
        result1 = refactormatrixy(currentmatrix, True)
        assert len(result1) == len(currentmatrix)
        result1_1 = refactormatrixy(currentmatrix, False)
        assert len(result1_1) == len(currentmatrix)
        currentmatrix2 = {
            "COASTAL SAND": [[0, 0], "HYDRO"],
            "OCEAN CURRENTS": [[0, 1], "HYDRO"],
            "SALT": [[0, 2], "HYDRO"],
            "SEAWATER": [[0, 3], "HYDRO"],
            "WAVES": [[0, 4], "HYDRO"],
            "ALGAE": [[0, 5], "ECOSYSTEM"],
            "AQUATIC PLANTS": [[0, 6], "ECOSYSTEM"],
            "BEACH WOOD": [[0, 7], "ECOSYSTEM"],
            "BIRDS": [[0, 8], "ECOSYSTEM"],
            "CLAMS": [[0, 9], "ECOSYSTEM"],
            "CLIMATE": [[0, 10], "ECOSYSTEM"],
            "SEA SHELLS": [[0, 24], "ECOSYSTEM"],
            "ANIMAL HABITATS": [[1, 4], "ECOSYSTEM"],
            "AQUATIC HABITAT": [[1, 5], "ECOSYSTEM"],
            "BIODIVERSITY INDICATOR": [[1, 6], "ECOSYSTEM"],
            "CARBON CAPTURE": [[1, 7], "ECOSYSTEM"],
            "CARBON SEQUESTRATION": [[1, 8], "ECOSYSTEM"],
            "FERTILIZER": [[1, 9], "ECOSYSTEM"],
            "FISHERIES": [[1, 10], "ECOSYSTEM"],
            "FOOD SOURCE": [[1, 11], "ECOSYSTEM"],
            "HABITAT": [[1, 12], "ECOSYSTEM"],
            "HABITAT RESTORATION/ALGAE CONTROL": [[1, 13], "ECOSYSTEM"],
            "NUTRIENT EXTRACTION": [[1, 14], "ECOSYSTEM"],
            "NUTRIENTS": [[1, 15], "ECOSYSTEM"],
            "ENERGY SOURCE": [[1, 27], "ENERGY"],
            "WIND ENERGY": [[1, 28], "ENERGY"],
            "WIND ENERGY SOURCE": [[1, 29], "ENERGY"],
            "WATER PURIFICATION": [[2, 0], "HYDRO"],
            "BIOMASS PRODUCTION": [[2, 0], "ENERGY"],
        }
        result2 = refactormatrixy(currentmatrix2, True)
        assert len(result2) == len(currentmatrix2)

    def test_sortnode(self):
        list1 = ['I1', 'I2', 'I3']
        list2=['A', 'INPUT']
        sysdict={'A': 'HYDRO', 'B': 'HYDRO', 'INPUT': 'HYDRO', 'OUTPUT': 'HYDRO', 'I1': 'HYDRO', 'I2': 'HYDRO', 'I3': 'HYDRO'}
        result1 = sortnode(mergelist(list1, list2), sysdict)
        assert len(result1) == len(mergelist(list1, list2))
    
class TestMatrixFunctions_archived:
    def test_flow_and_matrix_addinput1(self):
        #Addinput after addio
        queriedflow=[["i1","output"],["i2","output"],["i3","output"]]
        queriednodesys={k:"HYDRO" for k in unielement(queriedflow)}
        currentflow=[["input","output"],["A","B"]]
        currentmatrix={"A": [[0, 0], "HYDRO"],       "B": [[1, 0], "HYDRO"], 
                   "input": [[0, 1], "HYDRO"],  "output": [[1, 1], "HYDRO"], }
        updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-input")
        expectedflow=mergeflow(queriedflow,currentflow)
        expectedmatrix={"A": [[0, 0], "HYDRO"],       "B": [[1, 0], "HYDRO"], 
                       "i1": [[0, 1], "HYDRO"],  "output": [[1, 1], "HYDRO"],    
                       "i2": [[0, 2], "HYDRO"], 
                       "i3": [[0, 3], "HYDRO"], 
                    "input": [[0, 4], "HYDRO"], }
        expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
        logging.debug(updated_matrix)
        assert len(updated_flow)==len(expectedflow)
        assert updated_matrix==expectedmatrix
        
    def test_flow_and_matrix_addprocess1(self):
        #add process after addio
        queriedflow=[["i1", "p1", "p2", "p3", "output"],
                     ["i1", "p4", "p5", "p6", "output"]]
        queriednodesys={k:"HYDRO" for k in unielement(queriedflow)}
        currentflow=[["i1","output"],["i2","output"],["A","B"]]
        currentmatrix={"A": [[0, 0], "HYDRO"],           "B": [[1, 0], "HYDRO"], 
                      "i1": [[0, 1], "HYDRO"],      "output": [[1, 1], "HYDRO"], 
                      "i2": [[0, 2], "HYDRO"],      }
        expectedflow=mergeflow(queriedflow,currentflow)
        expectedmatrix={"A": [[0, 0], "HYDRO"],                                                             "B": [[1, 0], "HYDRO"], 
                       "i1": [[0, 1], "HYDRO"],                                                        "output": [[1, 1], "HYDRO"],
                                        "p1": [[0.1, 1.1], "HYDRO"], "p2": [[0.2, 1.1], "HYDRO"], "p3": [[0.3, 1.1], "HYDRO"], 
                                        "p4": [[0.1, 1.2], "HYDRO"], "p5": [[0.2, 1.2], "HYDRO"], "p6": [[0.3, 1.2], "HYDRO"], 
                        "i2": [[0, 2], "HYDRO"],    }
        expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
        updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-process")
        logging.debug(updated_matrix)
        assert len(updated_flow)==len(expectedflow)
        assert updated_matrix==expectedmatrix
        
    def test_flow_and_matrix_addprocess2(self):
        #add process after add process
        queriedflow=[["p1", "pp1", "pp2", "pp3", "p3"]]
        queriednodesys={k:"HYDRO" for k in unielement(queriedflow)}
        currentflow=[["i1","output"],["i2","output"],["A","B"],
                     ["i1", "p1", "p2", "p3", "output"],
                     ["i1", "p4", "p5", "p6", "output"],]
        currentmatrix={"A": [[0, 0], "HYDRO"],                                                             "B": [[1, 0], "HYDRO"], 
                      "i1": [[0, 1], "HYDRO"],                                                   "output": [[1, 1], "HYDRO"],
                                        "p1": [[0.1, 1.1], "HYDRO"], "p2": [[0.2, 1.1], "HYDRO"], "p3": [[0.3, 1.1], "HYDRO"], 
                                        "p4": [[0.1, 1.2], "HYDRO"], "p5": [[0.2, 1.2], "HYDRO"], "p6": [[0.3, 1.2], "HYDRO"], 
                      "i2": [[0, 2], "HYDRO"],   }
        expectedflow=mergeflow(queriedflow,currentflow)
        expectedmatrix={"A": [[0, 0], "HYDRO"],                                                                           "output": [[1, 0], "HYDRO"], 
                   "input1": [[0, 1], "HYDRO"],                                                                                "B": [[1, 1], "HYDRO"],
                                        "p1": [[0.1, 1.1], "HYDRO"],                                                              
                                        "p4": [[0.1, 1.2], "HYDRO"], "p5": [[0.2, 1.2], "HYDRO"], "p6": [[0.3, 1.2], "HYDRO"], 
                   "input2": [[0, 2], "HYDRO"],                                                                               "p3": [[1, 2], "HYDRO"],
                       "p2": [[0, 3], "HYDRO"],    
                                       "pp1": [[0.1, 3.1], "HYDRO"], "pp2": [[0.2, 3.2], "HYDRO"], "pp3": [[0.3, 3.3], "HYDRO"],}
        updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-process")
        logging.debug(updated_matrix)
        assert len(updated_flow)==len(expectedflow)
        assert updated_matrix==expectedmatrix
        
    def test_flow_and_matrix_addinput2(self):
        #Addinput after addprocess
        queriedflow=[["pi1","p3"],["pi2","p3"],["pi3","p3"]]
        queriednodesys={k:"HYDRO" for k in unielement(queriedflow)}
        currentflow=[["i1","output"],["i2","output"],["A","B"],
                     ["i1", "p1", "p2", "p3", "output"],
                     ["i1", "p4", "p5", "p6", "output"],]
        currentmatrix={"A": [[0, 0], "HYDRO"],                                                             "B": [[1, 0], "HYDRO"], 
                      "i1": [[0, 1], "HYDRO"],                                                   "output": [[1, 1], "HYDRO"],
                                        "p1": [[0.1, 1.1], "HYDRO"], "p2": [[0.2, 1.1], "HYDRO"], "p3": [[0.3, 1.1], "HYDRO"], 
                                        "p4": [[0.1, 1.2], "HYDRO"], "p5": [[0.2, 1.2], "HYDRO"], "p6": [[0.3, 1.2], "HYDRO"], 
                      "i2": [[0, 2], "HYDRO"],   }
        updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-input")
        expectedflow=mergeflow(queriedflow,currentflow)
        expectedmatrix={"A": [[0, 0], "HYDRO"],                                                                      "B": [[1, 0], "HYDRO"], 
                      "i1": [[0, 1], "HYDRO"],                                                                  "output": [[1, 1], "HYDRO"],
                                        "p1": [[0.1, 1.1], "HYDRO"], "p2": [[0.2, 1.1], "HYDRO"], 
                                        "p4": [[0.1, 1.2], "HYDRO"], "p5": [[0.2, 1.2], "HYDRO"], "p6": [[0.3, 1.2], "HYDRO"], 
                      "i2": [[0, 2], "HYDRO"],                                                                      "p3": [[1, 2], "HYDRO"], 
                     "pi1": [[0, 3], "HYDRO"],   
                     "pi2": [[0, 4], "HYDRO"],   
                     "pi3": [[0, 5], "HYDRO"],   }
        expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
        logging.debug(updated_matrix)
        assert len(updated_flow)==len(expectedflow)
        assert updated_matrix==expectedmatrix
        
    ###########################################################################################################################################
    # def test_flow_and_matrix_addinput2(self):
    #     #add complexity in currentflow
    #     queriedflow=[["i1","output"],["i2","output"],["i3","output"]]
    #     queriednodesys={"i1":"HYDRO","i2":"HYDRO","i3":"HYDRO","output":"HYDRO"}
    #     currentflow=[["input","p1","output"],["A","B"]]
    #     currentmatrix={   "A": [[0, 0], "HYDRO"],                  "B": [[1, 0], "HYDRO"], 
    #                   "input": [[0, 1], "HYDRO"],             "output": [[1, 1], "HYDRO"], 
    #                                          "p1": [[0.1, 1.1], "HYDRO"],   }
    #     updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-input")
    #     expectedflow=mergeflow(queriedflow,currentflow)
    #     expectedmatrix={    "A": [[0, 0], "HYDRO"],                  "B": [[1, 0], "HYDRO"], 
    #                        "i1": [[0, 1], "HYDRO"],             "output": [[1, 1], "HYDRO"], 
    #                        "i2": [[0, 2], "HYDRO"], 
    #                        "i3": [[0, 3], "HYDRO"], 
    #                     "input": [[0, 4], "HYDRO"],             
    #                                          "p1": [[0.1, 4.1], "HYDRO"],   }
    #     expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
    #     logging.debug(updated_matrix)
    #     assert len(updated_flow)==len(expectedflow)
    #     assert updated_matrix==expectedmatrix
        
    # def test_flow_and_matrix_addinput3(self):
    #     #add complexity in currentflow
    #     queriedflow=[["i1","output"],["i2","output"],["i3","output"]]
    #     queriednodesys={"i1":"HYDRO","i2":"HYDRO","i3":"HYDRO","output":"HYDRO"}
    #     currentflow=[["input","p1","output"],["A","B"]]
    #     currentmatrix={   "A": [[0, 0], "HYDRO"],                  "B": [[1, 0], "HYDRO"], 
    #                   "input": [[0, 1], "HYDRO"],             "output": [[1, 1], "HYDRO"], 
    #                                          "p1": [[0.1, 1.1], "HYDRO"],   }
    #     updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-input")
    #     expectedflow=mergeflow(queriedflow,currentflow)
    #     expectedmatrix={    "A": [[0, 0], "HYDRO"],                  "B": [[1, 0], "HYDRO"], 
    #                        "i1": [[0, 1], "HYDRO"],             "output": [[1, 1], "HYDRO"], 
    #                        "i2": [[0, 2], "HYDRO"], 
    #                        "i3": [[0, 3], "HYDRO"], 
    #                     "input": [[0, 4], "HYDRO"],             
    #                                          "p1": [[0.1, 4.1], "HYDRO"],   }
    #     expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
    #     logging.debug(updated_matrix)
    #     assert len(updated_flow)==len(expectedflow)
    #     assert updated_matrix==expectedmatrix          
        
          
    # def test_flow_and_matrix_addoutput1(self):
    #     queriedflow=[["input","o1"],["input","o2"],["input","o3"]]
    #     queriednodesys={"input":"HYDRO","o1":"HYDRO","o2":"HYDRO","o3":"HYDRO"}
    #     currentflow=[["input","output"],["A","B"]]
    #     currentmatrix={"A": [[0, 0], "HYDRO"],            "B": [[1, 0], "HYDRO"], 
    #                "input": [[0, 1], "HYDRO"],       "output": [[1, 1], "HYDRO"], }
    #     updated_flow,updated_matrix=update_flow_and_matrix(queriedflow,queriednodesys,currentflow,currentmatrix,"add-output")
    #     expectedflow=mergeflow(queriedflow,currentflow)
    #     expectedmatrix={"input": [[0, 0], "HYDRO"],       "B": [[1, 0], "HYDRO"], 
    #                         "A": [[0, 1], "HYDRO"],      "o1": [[1, 1], "HYDRO"], 
    #                                                      "o2": [[1, 2], "HYDRO"], 
    #                                                      "o3": [[1, 3], "HYDRO"], 
    #                                                  "output": [[1, 4], "HYDRO"], }
    #     expectedmatrix={clean(k):v for k,v in expectedmatrix.items()}
    #     logging.debug(updated_matrix)
    #     assert len(updated_flow)==len(expectedflow)
    #     assert updated_matrix==expectedmatrix
        

            
    ###############gen_and_return methods###################
    ##################################################


class TestGenAndReturnMethods:
    def test_queryflow_and_nodesys(self):
        test_mode1 = "add-process"
        queryflow1 = [["biogas", "biodiesel"], ["sea water", "salt production"]]
        queriedflow1, queriednodesys1 = return_queryflow_and_nodesys(
            test_mode1, queryflow1, queryflow1
        )
        logging.debug(queriedflow1, queriednodesys1)
        assert isinstance(queriedflow1, list)
        assert isinstance(queriedflow1[0], list)
        assert isinstance(queriednodesys1, dict)
        assert len(queriedflow1) > 1

    def test_genprocess(self):
        test_io1 = ["biogas", "biodiesel"]
        test_io2 = ["sea water", "salt production"]
        result1 = genprocess(test_io1)
        logging.debug(result1)

        result2 = genprocess(test_io2)
        logging.debug(result2)
        assert isinstance(result1, list)
        assert isinstance(result1[0], list)

    def test_return_addprocess(self):
        test_io1 = [["biogas", "biodiesel"], ["sea water", "salt production"]]
        result1 = return_addprocess(test_io1)
        logging.debug(result1)
        assert isinstance(result1, list)
        assert isinstance(result1[0], list)
        assert result1[0][0] == "biogas".upper()

    def test_genaddfeedback(self):
        test_tosearchnode1 = [
            ["RADAR SYSTEMS", "WEATHER DATA"],
            ["ASPHALT", "HEAT-ISLAND EFFECT MITIGATION"],
        ]
        test_usefulnode1 = [
            ["GEOTHERMAL ENERGY PLANTS", "RENEWABLE ENERGY SOURCES"],
            ["CARTOGRAPHY", "GEOSPATIAL DATA"],
            ["WATER USE DATA", "DATA FROM WATER MONITORING NETWORKS"],
            ["IONIC WIND-POWERED DRONES", "DRONE AND SATELLITE IMAGERY"],
            ["WELL INSTALLATION EQUIPMENT", "GROUND WATER MONITORING WELLS"],
            ["WEATHER STATIONS", "WEATHER PATTERNS AND CLIMATOLOGY DATA"],
            ["WATER LEVEL METERS", "GROUND WATER MONITORING WELLS"],
            ["ICT INFRASTRUCTURE", "DRONE AND SATELLITE IMAGERY"],
            ["SOIL ANALYSIS", "AQUIFER STUDIES"],
            ["SPACE ON BUILDINGS OR FREESTANDING STRUCTURES", "BILLBOARDS"],
            ["WI-FI SIGNALS", "DATA TRANSFER"],
            ["AERIAL PHOTOGRAPHY", "GEOSPATIAL DATA"],
            ["REMOTE SENSING DEVICES", "SATELLITES"],
            ["HEAVY MACHINERY FOR DAM CONSTRUCTION", "DAMS AND RESERVOIRS"],
            ["GEOGRAPHIC INFORMATION SYSTEMS (GIS)", "GEOSPATIAL DATA"],
            ["AIR QUALITY", "ENVIRONMENTAL QUALITY INDICATOR"],
            ["GEOCHEMICAL DATA", "AQUIFER STUDIES"],
            ["LIDAR (LIGHT DETECTION AND RANGING) SYSTEMS", "GEOSPATIAL DATA"],
            ["PROFESSIONAL AND EXPERT HUMAN RESOURCES", "SCIENTIFIC RESEARCH"],
            ["METEOROLOGICAL DATA", "DATA FROM WATER MONITORING NETWORKS"],
            ["TELECOMMUNICATION", "WEATHER STATIONS"],
            ["SOLAR ENERGY", "ADVANCED ENERGY STORAGE SYSTEMS"],
            ["MACHINE LEARNING ALGORITHMS", "DRONE AND SATELLITE IMAGERY"],
            ["ATMOSPHERIC DATA", "SATELLITE IMAGERY"],
            ["SPACE-BASED TELESCOPES", "ORBIT AND NAVIGATION DATA"],
            [
                "LIGHT DETECTION AND RANGING (LIDAR) SYSTEMS",
                "REMOTE SENSING TECHNOLOGY",
            ],
            ["SQUIRRELS", "SEED DISPERSAL"],
            ["RADIATION SENSORS", "SATELLITE IMAGERY"],
            ["GROUNDWATER MONITORING", "AQUIFER STUDIES"],
            ["TRAINED PERSONNEL", "SATELLITE IMAGERY"],
            ["RECYCLING FACILITIES", "WASTE REDUCTION"],
            ["RECREATION MANAGEMENT STRATEGIES", "RECREATION AREA"],
            ["SCIENTIFIC RESEARCH", "ORBIT AND NAVIGATION DATA"],
            ["BIOMASS ENERGY", "RENEWABLE ENERGY SOURCES"],
            ["INVESTMENTS IN DRONE TECHNOLOGY", "DRONE AND SATELLITE IMAGERY"],
            ["CLIMATE DATA", "AQUIFER STUDIES"],
            ["HIGH SPEED INTERNET", "SCIENTIFIC RESEARCH"],
            ["INDUSTRIAL PROCESSES", "CO2"],
            ["IMAGE PROCESSING SOFTWARE", "SATELLITE IMAGERY"],
            [
                "DATA FROM WATER MONITORING NETWORKS",
                "GEOLOGICAL DATA ABOUT THE UNDERGROUND WATER TABLE",
            ],
            ["WEATHER PATTERNS AND CLIMATOLOGY DATA", "SATELLITE IMAGERY"],
            ["SOIL MOISTURE SENSORS", "HYDROLOGICAL DATA AND RIVER LEVEL"],
            ["SATELLITE IMAGERY", "WEATHER DATA"],
            ["RADAR SYSTEMS", "ORBIT AND NAVIGATION DATA"],
            ["GLOBAL NAVIGATION SATELLITE SYSTEMS (GNSS)", "ORBIT AND NAVIGATION DATA"],
            ["GEOLOGICAL SURVEYS", "GROUND WATER MONITORING WELLS"],
            ["DATA PROCESSING ALGORITHMS", "SATELLITE IMAGERY"],
            ["GEOGRAPHICAL INFORMATION SYSTEM (GIS) DATA", "SATELLITE IMAGERY"],
            ["PIGEONS", "STUDY OF URBAN WILDLIFE/BIODIVERSITY"],
            ["BIKE LANES", "CARBON EMISSION REDUCTION"],
            ["LAUNCH VEHICLE", "SATELLITE IMAGERY"],
            ["RENEWABLE ENERGY RESOURCES", "HEAT ENERGY"],
            ["GROUNDWATER SENSORS", "HYDROLOGICAL DATA"],
            ["AQUIFER STUDIES", "GROUND WATER MONITORING WELLS"],
            ["STORMWATER MANAGEMENT INTERVENTIONS", "URBAN HEAT ISLAND MITIGATION"],
            ["WIND ENERGY", "ADVANCED ENERGY STORAGE SYSTEMS"],
            [
                "HISTORICAL WEATHER PATTERN DATA",
                "WEATHER PATTERNS AND CLIMATOLOGY DATA",
            ],
            ["RAINFALL DATA AND PATTERNS", "HYDROELECTRICITY"],
            ["SOIL MOISTURE CONTENT SENSORS", "GROUND WATER MONITORING WELLS"],
            ["CAR EMISSIONS", "CLIMATE CHANGE INDICATOR"],
            ["PENSTOCK", "HYDROELECTRICITY"],
            ["PARK FUNDING AND MAINTENANCE", "RECREATION AREA"],
            ["TELESCOPES", "REMOTE SENSING TECHNOLOGY"],
            ["SATELLITE DATA", "WEATHER STATIONS"],
            ["ASTRONAUTS' OBSERVATIONS", "ORBIT AND NAVIGATION DATA"],
            ["SATELLITE IMAGERY", "HYDROLOGICAL DATA AND RIVER LEVEL"],
            ["GEOPHYSICAL SURVEYS", "AQUIFER STUDIES"],
            ["AIR POLLUTION", "CLIMATE CHANGE INDICATOR"],
            ["HYDROLOGICAL DATA", "GROUND WATER MONITORING WELLS"],
            ["HELIUM OR HYDROGEN GAS", "METEOROLOGICAL BALLOONS"],
            ["ENERGY EFFICIENT APPLIANCES", "ENERGY USE"],
            ["DAMS AND RESERVOIRS", "HYDROELECTRICITY"],
            ["ECO-FRIENDLY BUILDINGS", "LOW CARBON EMISSIONS"],
            ["CLIMATE CHANGE MODELS", "HYDROLOGICAL DATA"],
            ["HUMAN EXPERTISE IN DAM DESIGN AND CONSTRUCTION", "DAMS AND RESERVOIRS"],
            ["ACADEMIC AND RESEARCH INSTITUTIONS", "SCIENTIFIC RESEARCH"],
            ["WEATHER STATIONS", "HYDROLOGICAL DATA"],
            ["RENEWABLE ENERGY SOURCES", "ENERGY USE"],
            ["PUBLIC POLICY", "HUMAN POPULATION"],
            ["WATER QUALITY SENSORS", "DATA FROM WATER MONITORING NETWORKS"],
            ["BRIDGES", "TOURIST ATTRACTION"],
            ["RADAR SYSTEMS", "WEATHER PATTERNS AND CLIMATOLOGY DATA"],
            ["NATURAL AND MANMADE SPACES", "RECREATION AREA"],
            ["ICE CORES", "METEOROLOGICAL DATA"],
        ]
        result1 = genaddfeedback(test_tosearchnode1, test_usefulnode1)
        assert isinstance(result1, list)

    def test_return_addfeedback(self):
        test_tosearchnode1 = [
            ["RADAR SYSTEMS", "WEATHER DATA"],
            ["ASPHALT", "HEAT-ISLAND EFFECT MITIGATION"],
        ]
        test_usefulnode1 = [
            ["RADAR SYSTEMS", "WEATHER DATA"],
            ["ASPHALT", "HEAT-ISLAND EFFECT MITIGATION"],
            ["KNOWLEDGE OF METEOROLOGY", "WEATHER STATIONS"],
            ["DOPPLER RADAR", "HYDROLOGICAL DATA AND RIVER LEVEL"],
            ["GREEN ROOFS AND WALLS", "URBAN HEAT ISLAND MITIGATION"],
            ["SOLAR PANELS", "RENEWABLE ENERGY RESOURCES"],
            ["UTILITIES CONNECTION", "BILLBOARDS"],
            ["HEALTH SERVICE INFRASTRUCTURE", "HUMAN POPULATION"],
            ["COMMUNITY ENGAGEMENT", "RECREATION AREA"],
            ["RAINFALL/RUNOFF", "DAMS AND RESERVOIRS"],
            ["GPS (GLOBAL POSITIONING SYSTEM) DATA", "GEOSPATIAL DATA"],
            ["EDUCATION", "HUMAN POPULATION"],
            ["DATA PROCESSING ALGORITHMS", "SATELLITE IMAGERY"],
            ["GEOGRAPHICAL INFORMATION SYSTEM (GIS) DATA", "SATELLITE IMAGERY"],
            ["PIGEONS", "STUDY OF URBAN WILDLIFE/BIODIVERSITY"],
            ["BIKE LANES", "CARBON EMISSION REDUCTION"],
            ["LAUNCH VEHICLE", "SATELLITE IMAGERY"],
            ["RENEWABLE ENERGY RESOURCES", "HEAT ENERGY"],
            ["GROUNDWATER SENSORS", "HYDROLOGICAL DATA"],
            ["AQUIFER STUDIES", "GROUND WATER MONITORING WELLS"],
            ["STORMWATER MANAGEMENT INTERVENTIONS", "URBAN HEAT ISLAND MITIGATION"],
            ["WIND ENERGY", "ADVANCED ENERGY STORAGE SYSTEMS"],
            ["GEO-SPATIAL DATA", "SATELLITE IMAGERY"],
            ["URBAN TREES AND VEGETATION", "URBAN HEAT ISLAND MITIGATION"],
            ["INTERNATIONAL SPACE STATION", "ORBIT AND NAVIGATION DATA"],
            ["METEOROLOGICAL STATIONS", "WEATHER DATA"],
            ["WEATHER DATA", "METEOROLOGICAL BALLOONS"],
            ["GROUND WATER MONITORING WELLS", "HYDROLOGICAL DATA AND RIVER LEVEL"],
            ["HYDROELECTRIC POWER PLANTS", "RENEWABLE ENERGY SOURCES"],
            ["URBAN CLIMATE STUDIES", "URBAN HEAT ISLAND MITIGATION"],
            ["METEOROLOGICAL SATELLITES", "WEATHER PATTERNS AND CLIMATOLOGY DATA"],
            ["AVAILABILITY OF JOBS", "HUMAN POPULATION"],
            ["WEATHER STATIONS", "HYDROLOGICAL DATA"],
            ["RENEWABLE ENERGY SOURCES", "ENERGY USE"],
            ["PUBLIC POLICY", "HUMAN POPULATION"],
            ["WATER QUALITY SENSORS", "DATA FROM WATER MONITORING NETWORKS"],
            ["BRIDGES", "TOURIST ATTRACTION"],
            ["RADAR SYSTEMS", "WEATHER PATTERNS AND CLIMATOLOGY DATA"],
            ["NATURAL AND MANMADE SPACES", "RECREATION AREA"],
            ["ICE CORES", "METEOROLOGICAL DATA"],
        ]
        result1 = return_addfeedback(test_tosearchnode1, test_usefulnode1)
        print(result1)
        self.assertIsInstance(result1, list)
        self.assertIsInstance(result1[0], list)
        self.assertTrue(result1[0][0] in unielement(test_tosearchnode1))

    def test_genaddcooptimization(self):
        test_input1 = ["biogas", "soil", "ice"]
        result1 = genaddcooptimization(test_input1)
        assert isinstance(result1, list)

    def test_return_addcooptimization(self):
        test_input1 = ["biogas", "soil", "ice"]
        result1 = return_addcooptimization(test_input1)
        logging.debug(result1)
        assert isinstance(result1, list)
        assert isinstance(result1[0], list)
        assert result1[0][0] == "biogas".upper()

    def test_return_system(self):
        testlist1 = [
            "BEACH INFRASTRUCTURE",
            "SHORELINE PROTECTION",
            "VEGETATION PLANTING",
            "WAVE ENERGY ABSORPTION",
            "SAND DUNES STABILIZATION",
            "GROINS",
            "REVETMENTS",
            "MARSHES",
            "BEACH EROSION PREVENTION",
            "SEAWALLS",
            "BREAKWATERS",
            "BEACH NOURISHMENT",
            "WAVE ENERGY DISSIPATION",
            "COASTAL LAGOONS",
        ]
        result1 = return_system(testlist1)
        assert isinstance(result1, dict)
        logging.debug(result1)


class TestResponseMethods:
    @pytest.fixture(autouse=True)
    def set_up(self, app):
        """Setup that requires app context."""
        with app.app_context():
            genio_from_description(9, 1, "This is a coastal environment")

    def test_update_flow_and_matrix_addinput(self, app):
        with app.app_context():
            prompt_before_result1 = get_prompt(9)
            queriedflow, queriednodesys = return_queryflow_and_nodesys(
                "add-input",
                prompt_before_result1["flow"][0],
                prompt_before_result1["flow"],
            )
            updatedflow, updatedmatrix = update_flow_and_matrix(
                queriedflow,
                queriednodesys,
                prompt_before_result1["flow"],
                prompt_before_result1["node"],
                "add-input",
            )
            assert isinstance(updatedflow, list)
            assert isinstance(updatedmatrix, dict)
            assert len(updatedmatrix) > len(prompt_before_result1["node"])
            logging.debug(updatedmatrix)

    def test_update_flow_and_matrix_addoutput(self, app):
        with app.app_context():
            prompt_before_result1 = get_prompt(9)
            queriedflow, queriednodesys = return_queryflow_and_nodesys(
                "add-output",
                prompt_before_result1["flow"][0],
                prompt_before_result1["flow"],
            )
            updatedflow, updatedmatrix = update_flow_and_matrix(
                queriedflow,
                queriednodesys,
                prompt_before_result1["flow"],
                prompt_before_result1["node"],
                "add-output",
            )
            assert isinstance(updatedflow, list)
            assert isinstance(updatedmatrix, dict)
            assert len(updatedmatrix) > len(prompt_before_result1["node"])
            logging.debug(updatedmatrix)

    def test_update_flow_and_matrix_addprocess(self, app):
        with app.app_context():
            prompt_before_result1 = get_prompt(9)

            queriedflow, queriednodesys = return_queryflow_and_nodesys(
                "add-process",
                [prompt_before_result1["flow"][0]],
                prompt_before_result1["flow"],
            )
            assert isinstance(queriedflow, list)
            assert isinstance(queriedflow[0], list)
            assert isinstance(queriednodesys, dict)

            updatedflow, updatedmatrix = update_flow_and_matrix(
                queriedflow,
                queriednodesys,
                prompt_before_result1["flow"],
                prompt_before_result1["node"],
                "add-process",
            )
            assert isinstance(updatedflow, list)
            assert isinstance(updatedmatrix, dict)
            assert len(updatedmatrix) > len(prompt_before_result1["node"])
            logging.debug(updatedmatrix)

    def test_update_flow_and_matrix_addfeedback(self, app):
        with app.app_context():
            prompt_before_result1 = get_prompt(9)
            queriedflow, queriednodesys = return_queryflow_and_nodesys(
                "add-feedback",
                prompt_before_result1["flow"][0],
                prompt_before_result1["flow"],
            )
            updatedflow, updatedmatrix = update_flow_and_matrix(
                queriedflow,
                queriednodesys,
                prompt_before_result1["flow"],
                prompt_before_result1["node"],
                "add-feedback",
            )
            assert isinstance(updatedflow, list)
            assert isinstance(updatedmatrix, dict)
            assert len(updatedmatrix) == len(prompt_before_result1["node"])
            logging.debug(updatedmatrix)

    def test_update_flow_and_matrix_addcooptimization(self, app):
        with app.app_context():
            prompt_before_result1 = get_prompt(9)
            queriedflow, queriednodesys = return_queryflow_and_nodesys(
                "add-cooptimization",
                prompt_before_result1["flow"][0],
                prompt_before_result1["flow"],
            )

            updatedflow, updatedmatrix = update_flow_and_matrix(
                queriedflow,
                queriednodesys,
                prompt_before_result1["flow"],
                prompt_before_result1["node"],
                "add-cooptimization",
            )
            assert isinstance(updatedflow, list)
            assert isinstance(updatedmatrix, dict)
            assert len(updatedmatrix) > len(prompt_before_result1["node"])
            logging.debug(updatedmatrix)


if __name__ == "__main__":
    # pytest.main(["test_addinput.py::TestHelperFunctions::test_sortnode", "-x"])
    pytest.main(
        [
            "test_addinput.py::TestMatrixFunctions",
            "-x",
        ]
    )
    # pytest.main(["test_addinput.py::TestGenAndReturnMethods::test_return_system","-x",])
