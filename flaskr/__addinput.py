import os
import json
import re
import random
import urllib
from openai import AsyncOpenAI
from instance.config import OPENAI_API_KEY
client = AsyncOpenAI(api_key=OPENAI_API_KEY)
import numpy as np
from collections import defaultdict
import asyncio
import aiohttp
from flaskr.project import *
from flaskr.__io import *
import math
import logging

# logging.basicConfig(
#     level=logging.DEBUG,
#     filename="./logs/test_logs_addiput.log",
#     filemode="a",
#     format="%(asctime)s - %(levelname)s - %(message)s",
# )


######################################################
######################################################
# Helper Functions
def cleangenio(string: str, query: list, querytype: str = "output"):
    query = [clean(node) for node in query]

    first_index = string.index("[")
    last_index = string.rindex("]")
    new_string = string[first_index + 1 : last_index]
    # do not use the below syntax to extract the string by intention,
    # in gencooptimization, the first "[" is not placed at the beginning of the string
    # new_string = string.strip()[1:-1]

    tempflow = extract_brackets(new_string)
    flowlist = []
    for temp in tempflow:
        try:
            templist = extract_quotation(temp)
            templist = [clean(node) for node in templist]
            if querytype == "output":
                if templist[1] in query:
                    flowlist.append(templist)
            elif querytype == "input":
                if templist[0] in query:
                    flowlist.append(templist)
        except:
            print(f"{temp} cannot be converted")
            continue

    return flowlist

def cleangencoop(string: str, query: list)->(str, list):
    query = [clean(node) for node in query]

    first_index = string.index("[")
    last_index = string.rindex("]")
    # do not use the below syntax to extract the string by intention,
    # in gencooptimization, the first "[" is not placed at the beginning of the string
    # new_string = string.strip()[1:-1]
    flow_string = string[first_index + 1 : last_index]
    tempflow = extract_brackets(flow_string)
    flowlist = []
    for temp in tempflow:
        try:
            templist = extract_quotation(temp)
            templist = [clean(node) for node in templist]
            if templist[0] in query:
                flowlist.append(templist)

        except:
            print(f"{temp} cannot be converted")
            continue

    # info_string = string[:first_index]
    know_string = string[:first_index]
    cleaned_string=''
    #find the first ":"
    first_semicolon = know_string.index(":")
    #find the last quotation mark
    last_quotation = know_string.rindex('"')
    cleaned_string = know_string[first_semicolon+1:last_quotation+1].strip()
    logging.debug(f"cleangencoop: {cleaned_string}")
    return cleaned_string, flowlist

def cleangenprocess(flow_string):
    # Get the first index of "["
    first_index = flow_string.index("[")
    # Get the last index of "]"
    last_index = flow_string.rindex("]")
    # Get the string between first and last index
    new_string = flow_string[first_index + 1 : last_index]

    flowlist = []
    tempflow = extract_brackets(new_string)
    for temp in tempflow:
        templist = extract_quotation(temp)
        cleanlist = [clean(ele) for ele in templist]
        flowlist.append(cleanlist)

    return flowlist

def cleangenknowledge(flow_string):
    # Get the first index of "["
    first_index = flow_string.index("[")
    # Get the last index of "]"
    last_index = flow_string.rindex("]")
    # Get the string between first and last index
    new_string = flow_string[first_index + 1 : last_index]

    flowlist = []
    tempflow = extract_brackets(new_string)
    for temp in tempflow:
        templist = extract_quotation(temp)
        cleanlist = [clean(ele,False) for ele in templist]
        flowlist.append(cleanlist)

    return flowlist

def maplistx(currentx: list, use_zero_index=False) -> list:
    """
    return a list of the same length of 1 arithmetic progression
    for all integers, do not affect the floatas

    if currentx1 = [-1, 0, 2, 3, 4]
    expected1[1] = [0, 1, 2, 3, 4] if use_zero_index = False
    expected1[1] = [-1, 0, 1, 2, 3] if use_zero_index = True

    The below scenario explained are all with use_zero_index = False
    if currentx2 = [0, 4, 4.1, 4.2, 4.3, 6]
    expected2[1] = [0, 1, 1.1, 1.2, 1.3, 2]

    if currentx3 = [0, 3, 4, 4.1, 4.2, 4.3, 5]
    expected3[1] =  [0, 1, 2, 2.1, 2.2, 2.3, 3]

    Args: currentx(list) - list of integers and floats
    """
    # sauce to customize zero index location
    if use_zero_index:
        try:
            start_index = currentx.index(0)
        except ValueError:
            start_index = 0
    else:
        start_index = 0

    newx = [None] * len(currentx)
    newx[start_index] = 0
    # Forward pass to set values after the start index
    last_integer_index = start_index
    for i in range(start_index + 1, len(currentx)):
        if isinstance(currentx[i], int):
            newx[i] = newx[last_integer_index] + 1
            last_integer_index = i
        else:  # Handle floats
            newx[i] = newx[last_integer_index] + round(currentx[i] % 1, 1)

    # Backward pass
    last_integer_index = start_index
    for i in range(start_index - 1, -1, -1):
        if isinstance(currentx[i], int):
            newx[i] = newx[last_integer_index] - 1
            last_integer_index = i
        else:  # Issues might involve with negative float parts
            newx[i] = newx[last_integer_index] - round(currentx[i] % 1, 1)

    return currentx, newx

def mapX(currentx, use_zero_index=False) -> dict:
    currentx = sorted(list(set(currentx)))
    currentx, newx = maplistx(currentx, use_zero_index)
    mapXdict = dict(zip(currentx, newx))
    return mapXdict

def npsearcher(twodimensionlist: list, tosearchnode: list) -> list:
    """
    Convert a two-dimensional list to a NumPy array and search for nodes that
    have the same x-coordinate as `tosearchnode`. Return the x-coordinate and
    the minimum y-coordinate among these nodes.

    Args:
        twodimensionlist (list): A list of lists, each containing [x, y] coordinates.
        tosearchnode (list): A list containing the [x, y] coordinate to search for.

    Returns:
        list: A list containing the x-coordinate and the minimum y-coordinate of
              the nodes with the same x-coordinate as `tosearchnode`.
    """
    # Convert the two-dimensional list to a NumPy array
    array = np.array(twodimensionlist)
    search_x = tosearchnode[0]

    # Filter the array to get all rows where the x-coordinate matches `search_x`
    filtered = array[array[:, 0] == search_x]

    # Find the minimum y-coordinate for these filtered results
    if filtered.size > 0:
        min_y = int(np.min(filtered[:, 1]) - 1)
    else:
        return [search_x, 0]
    return [search_x, min_y]

def refactormatrixy(matrix: dict, syscolor:dict ,use_sys_sort: bool = False) -> dict:
    """
    Refactor the y-coordinates of nodes in the matrix such that for each unique x-coordinate,
    the y-coordinates are sorted and then re-assigned starting from 0 in ascending order.

    Args:
        matrix (dict): A dictionary of the format {node: [[coorx, coory], sys]}
    Returns:
        dict: A dictionary with updated y-coordinates.
    """
    # for node in matrix.keys():
    #     if is_process(matrix[node]):
    #         #remove this node from matirx
    #         matrix.pop(node)

    # Organize nodes by their x-coordinate
    # Example data of sorted_by_x: defaultdict(<class 'list'>, {1: [('x', 2, 'HYDRO'), ('y', 2, 'ENERGY')]})
    sorted_by_x = defaultdict(list)
    sysdict = defaultdict(list)
    for node, [(coorx, coory), sys] in matrix.items():
        sysdict[node] = sys
        sorted_by_x[coorx].append((node, coory))

    refactored_matrix = defaultdict(list)

    for coorx, nodetup in sorted_by_x.items():
        if use_sys_sort:
            nodelist = [node for node, coory in nodetup]
            nodelist = sortnode(nodelist, sysdict,syscolor)
            for i, node in enumerate(nodelist):
                refactored_matrix[node] = [[coorx, i], sysdict[node]]
        else:
            sorted_nodes = sorted(nodetup, key=lambda x: x[1])
            for i, (node, coory) in enumerate(sorted_nodes):
                refactored_matrix[node] = [[coorx, i], sysdict[node]]
    return refactored_matrix


def mergeflow(queriedflow: list, currentflow: list) -> list:
    """flow is nested list"""
    unique_tuples = set(tuple(item) for item in queriedflow + currentflow)
    updatedflow = [list(tup) for tup in unique_tuples]
    return updatedflow


def mergelist(list1: list, list2: list) -> list:
    unique_item = set(list1 + list2)
    return list(unique_item)


def parseflow(nestedflow: list) -> list:
    """parse flow into two lists - io, and ipo"""
    io = []
    ipo = []
    for flow in nestedflow:
        if len(flow) == 2:
            io.append(flow)
        elif len(flow) > 2:
            ipo.append(flow)
    return io, ipo

def parsematrix(matrix: dict) -> dict:
    """parse matrix into two matrixs, io, and p"""
    io={}
    p={}
    for node in matrix.keys():
        if is_process(matrix[node]):
            p[node] = matrix[node]
        else:
            io[node] = matrix[node]
    return io, p

def is_process(node: list) -> bool:
    """
    node is represented by a list as [[x, y], sys],
    if x.is_integer() or y.is_integer() then it is a process
    """
    return node[0][0].is_integer() or node[0][1].is_integer()


######################################################
######################################################
## gen "add-input"
async def genaddinput(output:list, sysdict:dict, randomNumber=3) -> list:
    """return input resources from output
    Args:
    output(list) -- the output resources
    system(list) -- the system info

    Returns:
    [[i1,o1],[i2,o2],...] -- a list of list of input and output
    """

    try:
        response =await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"""You are an encyclopedia.Given the outputs, please come up with input resources from the systems I provided. \
                        These input-output pairs aim at resource co-optimization, net-zero environment, circular economy, etc. \
                        Please come up with three to five inputs for each output provided, and please make sure that you thought about every system and don't be generic. and return them in this format: [[input1, output1], [input2, output2],...]""",
            },
            {"role": "user", 
             "content": 'output: ["irrigation water", "wind"], system:["HYDRO", "ENERGY", "ECOSYSTEM"]'},
            {
                "role": "assistant",
                "content": '[["rainwater harvesting", "irrigation water"],["reclaimed water", "irrigation water"],  ["river diversion and canal", "irrigation water"], ["solar-powered water pumps", "irrigation water"],  ["desalination plants powered by renewable energy", "irrigation water"], ["wastewater treatment and reuse", "irrigation water"],  ["smart irrigation systems", "irrigation water"], ["water storage", "irrigation water"], ["constructed Wetlands", "irrigation water"], ["agroforestry", "irrigation water"], ["wind turbine", "wind energy"], ["meteorological data",  "wind energy"], ["composting", "wind energy"]]',
            },
            {"role": "user", "content": 'output: ["biofuel", "wifi"], system:["ENERGY", "ECOSYSTEM", "TELECOMMUNICATION"]'},
            {
                "role": "assistant",
                "content": '[["municipal solid waste", "biofuel"], ["algae biomass", "biofuel"], ["crop residues", "biofuel"], ["animal fat", "biofuel"], ["atmospheric CO2", "biofuel"], ["digesters", "biofuel"], ["broadband infrastructure", "wifi"], ["fiber-optic networks", "wifi"],["antenna", "wifi"], ["satellite", "wifi"], ["regulated radio waves", "wifi"], ["existing electrical grid", "wifi"]]',
            },
            {"role": "user", "content": f'output: {output}, system:{list(sysdict.keys())}',},
        ],
        temperature=1,
        max_tokens=512,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        n=randomNumber)
        output_string = response.choices[0].message.content
        return cleangenio(output_string, output, querytype="output")
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


## gen "add-output"
async def genaddoutput(input, sysdict:dict, randomNumber=3) -> list:
    """return input resources from output
    Args:
    output(list) -- the output resources
    system(list) -- the system info

    Returns:
    [[i1,o1],[i2,o2],...] -- a list of list of input and output
    """
    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
            "role": "system",
            "content": [
                {
                "type": "text",
                "text": "You are an encyclopedia. Given the input list, please come up with output resources from the systems I provided. These input-output pairs aim at resource co-optimization and achieve enhanced sustainability goals. Input and output resources are components of the systems I provided. Please come up with two to five outputs for each input provided. If there are over 15 inputs, generate two to three for each. If not that many, generate three to five for each. Please generate around 45 input-output pairs in total. Please make sure you thought about every input and every system. \
                Please avoid generic sustainability goals and similar meaning outputs. Check all outputs, and if you come up with \"crop yield protection\", \"crop yield improvement\", as the output of  \"waste water\" and \"crop yield optimization\" as the output of \"organic waste\". \"crop yield protection\", \"crop yield improvement\", and \"crop yield optimization\" are similar meaning and you should only have one of them as the common output of \"organic waste\" and \"wast water\". \nPlease return them in this format: [[\"input1\", \"output1\"], [\"input2\", \"output2\"],...]"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "input: [\"waste water\", \"organic waste\", \"wind\"], system:[\"HYDRO\", \"ENERGY\", \"ECOSYSTEM\"]"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "[[\"WASTE WATER\", \"RENEWABLE ENERGY PRODUCTION\"],\n[\"WASTE WATER\", \"MICROBIAL FUEL CELLS\"],\n[\"WASTE WATER\", \"NUTRIENT EXTRACTION FOR AGRICULTURE\"],\n[\"WASTE WATER\", \"SAFE DRINKING WATER\"],\n[\"WASTE WATER\", \"INDUSTRIAL COOLING PROCESSES\"],\n[\"WASTE WATER\", \"BIOGAS GENERATION\"],\n[\"ORGANIC WASTE\", \"NUTRIENT EXTRACTION FOR AGRICULTURE\"],\n[\"ORGANIC WASTE\", \"METHANE CAPTURE AND UTILIZATION\"],\n[\"ORGANIC WASTE\", \"ORGANIC FERTILIZER\"],\n[ORGANIC WASTE, ANAEROBIC DIGESTION],\n[\"ORGANIC WASTE\", \"BIOGAS GENERATION\"],\n[\"WIND\",\"HYDROGEN\"],\n[\"WIND\",\"STORED IN BATTERIES\"],\n[\"WIND\", \"SUSTAINABLE HYDROPOWER INTEGRATION\"],\n[\"WIND\", \"HUMIDITY\"],\n[\"WIND\", \"RENEWABLE ENERGY PRODUCTION\"]]"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "input: [\"biofuel\", \"wifi\"], system:[\"ENERGY\", \"ECOSYSTEM\", \"TELECOMMUNICATION\"]"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "[[\"BIOFUEL\", \"REDUCTION OF GREENHOUSE GASES\"], [\"BIOFUEL\", \"BIODEGRADABLE BYPRODUCTS\"], [\"BIOFUEL\", \"SUPPORT FOR RURAL ECONOMIES\"], [\"BIOFUEL\", \"GENERATION OF INDUSTRIAL HEAT\"], [\"WIFI\", \"SMART GRID MANAGEMENT\"], [\"WIFI\", \"REMOTE AGRICULTURAL MONITORING\"], [\"WIFI\", \"WILDLIFE TRACKING\"], [\"WIFI\", \"ENHANCED TELECOMMUNICATION INFRASTRUCTURE\"], [\"WIFI\", \"REMOTE ENVIRONMENTAL SENSING\"]]"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "input: [\"CONTROLLED DRAINAGE SYSTEMS\", \"POTABLE WATER\", \"RECLAIMED WATER SYSTEMS\", \n\"STORMWATER MANAGEMENT SYSTEMS\", \"WATER TANKS\", \"HERB GARDENS\", \"ROOFTOP GARDENS\", \"SHRUBS\", \"URBAN WILDLIFE\",\"VERTICAL GARDENS\",\"AIR QUALITY SENSORS\",\"METAL FRAMES\", \"SENSORS\", \"TECHNICAL MONITORING SYSTEMS\",\"BIO-WASTE DIGESTERS\",\"COMPOST BINS\", \"FIBER OPTIC CABLES\",\"SIGNAL BOOSTERS\",  \"ELECTRIC VEHICLE CHARGING STATIONS\", \n\"PEDESTRIAN PATHWAYS\", \"PUBLIC TRANSPORT ACCESS\", \"BUILDING INSULATION\", \"PHOTOVOLTAIC GLASS\", \"SOLAR PANELS\"], system: [\"HYDRO\", \"ENERGY\", \"BIOSYSTEM\", \"TELECOMMUNICATION\", \"UNKNOWN\", \"MOBILITY\", \"SOLID WASTE\"]"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "[[\"CONTROLLED DRAINAGE SYSTEMS\", \"ENHANCED CROP YIELD THROUGH OPTIMAL SOIL MOISTURE CONTROL\"], [\"CONTROLLED DRAINAGE SYSTEMS\", \"MINIMIZED EUTROPHICATION\"], [\"CONTROLLED DRAINAGE SYSTEMS\", \"ADAPTIVE FLOOD MITIGATION\"], [\"CONTROLLED DRAINAGE SYSTEMS\", \"AQUIFER RECHARGE\"],\n[\"POTABLE WATER\", \"SAFE DRINKING WATER THROUGH FILTRATION\"], [\"POTABLE WATER\", \"INDUSTRIAL PROCESS WATER\"], [\"POTABLE WATER\", \"EMERGENCY RESERVES\"], [\"POTABLE WATER\", \"MEDICAL USAGE\"],\n[\"RECLAIMED WATER SYSTEMS\", \"AGRICULTURAL IRRIGATION WATER\"], [\"RECLAIMED WATER SYSTEMS\", \"COST-EFFECTIVE WATER REUSE FOR COOLING\"], [\"RECLAIMED WATER SYSTEMS\", \"WETLAND RESTORATION\"],\n[\"STORMWATER MANAGEMENT SYSTEMS\", \"ADAPTIVE FLOOD MITIGATION\"], [\"STORMWATER MANAGEMENT SYSTEMS\", \"AQUIFER RECHARGE\"], [\"STORMWATER MANAGEMENT SYSTEMS\", \"NON-POTABLE APPLICATIONS\"],\n[\"WATER TANKS\", \"EMERGENCY WATER SUPPLY STORAGE\"], [\"WATER TANKS\", \"RAINWATER HARVESTING\"], [\"WATER TANKS\", \"FIRE SUPPRESSION RESERVES\"], [\"WATER TANKS\", \"AGRICULTURAL IRRIGATION\"],\n[\"HERB GARDENS\", \"URBAN GREENING\"], [\"HERB GARDENS\", \"COMMUNITY HEALTH\"], [\"HERB GARDENS\", \"LOCAL FOOD PRODUCTION\"], [\"HERB GARDENS\", \"IMPROVED BIODIVERSITY\"],\n[\"ROOFTOP GARDENS\", \"URBAN HEAT ISLAND EFFECT REDUCTION\"], [\"ROOFTOP GARDENS\", \"INSULATION FOR BUILDINGS\"], [\"ROOFTOP GARDENS\", \"IMPROVED BIODIVERSITY\"], [\"ROOFTOP GARDENS\", \"LOCAL FOOD PRODUCTION\"],\n[\"SHRUBS\", \"EROSION CONTROL\"], [\"SHRUBS\", \"SHELTER AND FOOD FOR LOCAL WILDLIFE\"], [\"SHRUBS\", \"CARBON SEQUESTRATION\"], [\"SHRUBS\", \"AESTHETIC IMPROVEMENT\"], [\"URBAN WILDLIFE\", \"IMPROVED BIODIVERSITY\"], [\"URBAN WILDLIFE\", \"MAINTAINING PREDATOR-PREY DYNAMICS\"], [\"URBAN WILDLIFE\", \"LIVING LABORATORIES\"], [\"URBAN WILDLIFE\", \"RECREATION AND TOURISM\"],\n[\"VERTICAL GARDENS\", \"URBAN HEAT ISLAND EFFECT REDUCTION\"], [\"VERTICAL GARDENS\", \"IMPROVED AIR QUALITY\"], [\"VERTICAL GARDENS\", \"BUILDING INSULATION\"], [\"VERTICAL GARDENS\", \"LOCAL FOOD PRODUCTION\"], [\"AIR QUALITY SENSORS\", \"REAL-TIME AIR POLLUTION MONITORING\"],\n[\"AIR QUALITY SENSORS\", \"PUBLIC HEALTH DATA\"], [\"AIR QUALITY SENSORS\", \"ENVIRONMENTAL POLICY ENFORCEMENT\"], [\"AIR QUALITY SENSORS\", \"INDOOR AIR QUALITY MONITORING\"],\n[\"METAL FRAMES\", \"DURABLE FRAMES FOR GREEN BUILDING\"], [\"METAL FRAMES\", \"SOLAR PANELS\"], [\"METAL FRAMES\", \"STRONG AND DURABLE CONSTRUCTION MATERIALS\"],\n[\"SENSORS\", \"SMART IRRIGATION SYSTEMS\"], [\"SENSORS\", \"INFRASTRUCTURE HEALTH MONITORING\"], [\"SENSORS\", \"WILDLIFE TRACKING\"], [\"SENSORS\", \"REAL-TIME DATA COLLECTION FOR URBAN PLANNING\"],\n[\"TECHNICAL MONITORING SYSTEMS\", \"INFRASTRUCTURE HEALTH MONITORING\"], [\"TECHNICAL MONITORING SYSTEMS\", \"ENERGY USAGE OPTIMIZATION\"], [\"TECHNICAL MONITORING SYSTEMS\", \"RESOURCE MANAGEMENT\"],\n[\"BIO-WASTE DIGESTERS\", \"BIOGAS GENERATION\"], [\"BIO-WASTE DIGESTERS\", \"ORGANIC FERTILIZER PRODUCTION\"], [\"BIO-WASTE DIGESTERS\", \"WASTE VOLUME REDUCTION\"], [\"BIO-WASTE DIGESTERS\", \"REDUCED LANDFILL WASTE\"],\n[\"COMPOST BINS\", \"SOIL ENRICHMENT\"], [\"COMPOST BINS\", \"DIVERTING ORGANIC WASTE FROM LANDFILLS\"], [\"COMPOST BINS\", \"ORGANIC FERTILIZER PRODUCTION\"], [\"COMPOST BINS\", \"SUPPORTING LOCAL GARDEN\"], [\"FIBER OPTIC CABLES\", \"HIGH-SPEED INTERNET CONNECTIVITY\"], [\"FIBER OPTIC CABLES\", \"RELIABLE DATA TRANSMISSION\"], [\"FIBER OPTIC CABLES\", \"ENHANCED TELECOMMUNICATION INFRASTRUCTURE\"], [\"FIBER OPTIC CABLES\", \"SUPPORT FOR SMART CITY APPLICATIONS\"],\n[\"SIGNAL BOOSTERS\", \"IMPROVED CELLULAR CONNECTIVITY\"], [\"SIGNAL BOOSTERS\", \"ELIMINATING DEAD ZONES\"], [\"SIGNAL BOOSTERS\", \"REDUCED DROPPED CALLS\"], [\"SIGNAL BOOSTERS\", \"SUPPORT FOR REMOTE WORK AND TELECOMMUTING\"], [\"ELECTRIC VEHICLE CHARGING STATIONS\", \"SUPPORT FOR ELECTRIC VEHICLE ADOPTION\"], [\"ELECTRIC VEHICLE CHARGING STATIONS\", \"REDUCED GREENHOUSE GAS EMISSIONS\"], [\"ELECTRIC VEHICLE CHARGING STATIONS\", \"PROMOTE SUSTAINABLE TRANSPORTATION\"], [\"ELECTRIC VEHICLE CHARGING STATIONS\", \"REDUCED RELIANCE ON FOSSIL FUELS\"], [\"PEDESTRIAN PATHWAYS\", \"ENHANCED URBAN MOBILITY\"], [\"PEDESTRIAN PATHWAYS\", \"REDUCED TRAFFIC CONGESTION\"], [\"PEDESTRIAN PATHWAYS\", \"IMPROVED PUBLIC HEALTH\"], [\"PEDESTRIAN PATHWAYS\", \"INCREASED WALKABILITY\"], [\"PUBLIC TRANSPORT ACCESS\", \"REDUCED TRAFFIC CONGESTION\"], [\"PUBLIC TRANSPORT ACCESS\", \"LOWER CARBON FOOTPRINT\"], [\"PUBLIC TRANSPORT ACCESS\", \"ACCESSIBLE TRANSIT FOR ALL CITIZENS\"], [\"PUBLIC TRANSPORT ACCESS\", \"IMPROVED PUBLIC HEALTH\"],\n[\"BUILDING INSULATION\", \"ENERGY CONSERVATION\"], [\"BUILDING INSULATION\", \"REDUCED HEATING AND COOLING COSTS\"], [\"BUILDING INSULATION\", \"IMPROVED INDOOR COMFORT\"], [\"BUILDING INSULATION\", \"REDUCED GREENHOUSE GAS EMISSIONS\"], [\"PHOTOVOLTAIC GLASS\", \"SOLAR ENERGY GENERATION\"], [\"PHOTOVOLTAIC GLASS\", \"BUILDING ENERGY EFFICIENCY\"], [\"PHOTOVOLTAIC GLASS\", \"REDUCED CARBON FOOTPRINT\"], [\"PHOTOVOLTAIC GLASS\", \"AESTHETIC ARCHITECTURAL DESIGN\"], [\"SOLAR PANELS\", \"DISTRIBUTED ENERGY\"], [\"SOLAR PANELS\", \"ENERGY COST SAVINGS\"], [\"SOLAR PANELS\", \"REDUCED GREENHOUSE GAS EMISSIONS\"], [\"SOLAR PANELS\", \"DECENTRALIZED POWER\"]]\n "
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text":  f'input:{input}, system:{list(sysdict.keys())}'
                }
            ]
            },
        ],
        temperature=1,
        max_tokens=2048,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        n=randomNumber)
        output_string = response.choices[0].message.content
        return cleangenio(output_string, input, querytype="input")
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


## gen "add-process"
async def genknowledge(io, randomNumber=4):
    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """You are an encyclopedia. You are to provide knowledge for the generating input from output. 
            Flow is a list of two elements. The first element is the input and the second element is the output.
            Knowledge consists of four to five methods of generating the flow. Each method could be processes, resources, and technologies to transform input to output.
            Please don't make up the knowledge if you don't know it. 

            Here are examples:
            Flow: ["BRINE","BASO4"]
            Knowledge: [["Brine can transform to Baso4 through reproduction process."],["Brine can transform to BaSo4 through salt evaporation pond."], ["Brine can transform to Baso4 and NaCl through inverse osmosis."]] 
            ##

            Flow: ["WASTEWATER","AGRICULTURE"]
            Knowledge:[["Wastewater is processed in Wastewater Treatment Plant to output treated water. Treated water can be used for agriculture."],["Wastewater can cut the need for fertilisers, and improve soi quality, and be useful to agriculture."]]
            ##

            Flow: ["MOSS","HUMIDIFIER"]
            Knowledge: [["Moss has a large surface area relative to their volume. This extensive surface area allows them to capture more moisture from the air, which they then retain in their structure. This is how they become humidifier"],\
                        ["As moss releases moisture through evaporation, it helps cool the surrounding air. This cooling can also lead to condensation, further becoming local humidifier."], \
                        ["Moss can absorb water up to 20 times dry weight. Due to their cellular structure and the lack of a traditional root system, moss absorb moisture directly through their leaves and becomes humidifier"]]
            """,
            },
            {"role": "user", "content":f'Flow: {str(io)}'},
        ],
        temperature=1,
        n=randomNumber)
        knowledge = response.choices[0].message.content
        return cleangenknowledge(knowledge)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None

async def returnknowledge(io, max_tries=3):
    knowledge = None
    for i in range(max_tries):
        knowledge = await genknowledge(io)
        if knowledge:
            break
    return knowledge

async def genprocess(io, knowledge=None, randomNumber=4) -> list:
    if knowledge == None:
        knowledge = await returnknowledge(io)
    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """You are to convert transformation knowledge into stepped list.
                    Each list has three to six sequenced nodes interpreting knowledge.""",
            },
            {
                "role": "user",
                "content": 'To transform "BRINE" to "BASO4", we know: [["Brine can transform to Baso4 through reproduction process."],["Brine can transform to Baso4 and Nacl through salt evaporation pond."], ["Brine can transform to Baso4 through inverse osmosis."]]',
            },
            {
                "role": "assistant",
                "content": '[["BRINE", "REPRODUCTION PROCESS", "BASO4"],["BRINE", "SALT EVAPORATION POND", "BASO4"],["BRINE", "INVERSE OSMOSIS", "BASO4"]] ',
            },
            {
                "role": "user",
                "content": 'To transform "WASTEWATER" to "AGRICULTURE", we know: [["Wastewater is processed in Wastewater Treatment Plant to output treated water. Treated water can be used for agriculture."],["Wastewater can cut the need for fertilisers, and improve soil quality, and be useful to agriculture."]]',
            },
            {
                "role": "assistant",
                "content": '[["WASTEWATER", "WASTEWATER TREATMENT PLANT", "TREATED WATER", "AGRICULTURE"],["WASTEWATER", "FERTILISER","SOIL QUALITY","AGRICULTURE"]]',
            },
            {
                "role": "user",
                "content": 'To transform "MOSS" to "HUMIDIFIER", we know: [["Moss has a large surface area relative to their volume. This extensive surface area allows them to capture more moisture from the air, which they then retain in their structure. This is how they become humidifier"],\
                        ["As moss releases moisture through evaporation, it helps cool the surrounding air. This cooling can also lead to condensation, further becoming local humidifier."], \
                        ["Moss can absorb water up to 20 times dry weight. Due to their cellular structure and the lack of a traditional root system, moss absorb moisture directly through their leaves and becomes humidifier"]]',
            },
            {
                "role": "assistant",
                "content": '[["MOSS", "LARGE SURFACE AREA", "CAPTURE MOISTURE","HUMIDIFIER"],\
                        ["MOSS", "RELEASE MOISTURE THROUGH EVAPORATION","COOL THE SURROUNDING AIR","CONDENSATION","HUMIDIFIER"],\
                            ["MOSS", "CELLULAR STRUCTURE", "LACK OF A TRADITIONAL ROOT SYSTEM", "ABSORB WATER UP TO 20 TIMES DRY WEIGHT", "HUMIDIFIER"]]',
            },
            {
                "role": "user",
                "content": f" To transform {io[0]} to {io[1]}, we know: {knowledge}",
            },
        ],
        temperature=0.5,
        max_tokens=1200,
        top_p=0.75,
        n=randomNumber)
        processs_string = response.choices[0].message.content
        process=cleangenprocess(processs_string)
        return (knowledge, process)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None, None


## gen "add-process"
async def genaddcooptimization(input: list, randomNumber=3) -> list:
    """return co-optimized resources from input

    Args:
    input(list) -- the input resources to cooptimize

    Returns:
    [[i1,o1],[i2,o1],[i3,o1],...,
     [i1,o2],[i2,o2],[i3,o2],...] -- a list of list of input and output
    """
    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"""
                    You are to co-optimize input resources to achieve greater sustainability, such as sustainable net-zero environment, circular economy, sustainable growth of a community.
                    Please try various combinations to generate flow outcomes, and organize in nested list.""",
            },
            {
                "role": "user",
                "content": "['VILLAGE','SOIL FERTILITY','MOUNTAINOUS TERRAIN']",
            },
            {
                "role": "assistant",
                "content": """Using Multiple Elements in One Flow:
                    1. Village + Mountainous Terrain: The hamlet is situated within a mountainous terrain, 
                    offering unique agricultural and tourism possibilities stemming from the topography.
                    Flow Outcome: "Niche High-Altitude Agriculture", "Eco-Tourism"
                    2. Soil Fertility + Mountainous Terrain: The co-optimization offers the natural composting process of forest litter and other organic materials.\n
                    Flow Outcome: "Forest litter and other organic materials"
                    3. Village + Soil Fertility: The people in the village engage in cultivation, taking advantage of the fertile soil to grow crops that feed the community.
                    Flow Outcome: "Local Self-Sustenance Farming"\n
                    
                    Organized as:
                    [["VILLAGE", "NICHE HIGH-ALTITUDE AGRICULTURE"],\n
                    ["MOUNTAINOUS TERRAIN", "NICHE HIGH-ALTITUDE AGRICULTURE"],\n
                    ["VILLAGE", "ECO-TOURISM"],\n
                    ["MOUNTAINOUS TERRAIN", "ECO-TOURISM"],\n
                    ["SOIL FERTILITY", "FOREST LITTER AND OTHER ORGANIC MATERIALS”], \n
                    ["MOUNTAINOUS TERRAIN ", "FOREST LITTER AND OTHER ORGANIC MATERIALS”], \n
                    ["VILLAGE", "LOCAL SELF-SUSTENANCE FARMING"],\n
                    ["SOIL FERTILITY", "LOCAL SELF-SUSTENANCE FARMING"]]""",
            },
            {
                "role": "user",
                "content": "['RESERVOIR', 'FLOODWATER', 'BIOMASS', 'IRRIGATION', 'WATER', 'WIND TURBINE']",
            },
            {
                "role": "assistant",
                "content": """Using Multiple Elements in One Flow:
                    1. Reservoir + Floodwater + Irrigation: Reservoirs collect excess floodwater and utilize it for controlled irrigation in dry seasons.\n
                    Flow Outcome: "Flood Mitigation", "Drought-Resistant Agriculture"
                    2. Wind Turbine + Reservoir: Wind turbines harness wind energy and power the pumping of water into reservoirs from various water sources.\n
                    Flow Outcome: "Renewable Energy-Pumped Water Storage"
                    3. Irrigation + Biomass: Biomass such as plant residues is utilized to retain soil moisture obtained from an irrigation system.\n
                    Flow Outcome: "Sustainable Soil Moisture Regulation"
                    4. Floodwater + Biomass: Diverting floodwater to generate controlled floods on farms that can spread nutrients from biomass along the floodplain.\n
                    Flow Outcome: "Natural Fertility Enhancement"
                    5. Biomass + Wind Turbine: Biomass waste from the local area is converted into gas, which turbines then burn to generate electricity.\n
                    Flow Outcome: "Biomass-Powered Energy Production"\n\n
                    
                    Organized as:
                    [
                    ["RESERVOIR", "FLOOD MITIGATION"],
                    ["FLOODWATER", "FLOOD MITIGATION"],
                    ["FLOODWATER", "IRRIGATION"],
                    ["RESERVOIR"," "DROUGHT-RESISTANT AGRICULTURE"],
                    ["FLOODWATER"," "DROUGHT-RESISTANT AGRICULTURE"],
                    ["FLOODWATER", " "DROUGHT-RESISTANT AGRICULTURE"],
                    ["WIND TURBINE", "RENEWABLE ENERGY-PUMPED WATER STORAGE"],
                    ["RESERVOIR", "RENEWABLE ENERGY-PUMPED WATER STORAGE"],
                    ["IRRIGATION", "SUSTAINABLE SOIL MOISTURE REGULATION"],
                    ["BIOMASS", "SUSTAINABLE SOIL MOISTURE REGULATION"],
                    ["FLOODWATER", "NATURAL FERTILITY ENHANCEMENT"],
                    ["BIOMASS", "NATURAL FERTILITY ENHANCEMENT"],
                    ["BIOMASS"," BIOMASS-POWERED ENERGY PRODUCTION"],
                    ["WIND TURBINE"," BIOMASS-POWERED ENERGY PRODUCTION"]
                    ]""",
            },
            {"role": "user", "content": str(input)},
        ],
        temperature=1,
        max_tokens=4096,
        top_p=1,
        frequency_penalty=0.2,
        presence_penalty=0,
        n=randomNumber)
        output_string = response.choices[0].message.content
        logging.debug(f"genaddcooptimization: {output_string}")
        return cleangencoop(output_string, input)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


## gen "add-feedback"
async def genaddfeedback(tosearchnode: list, usefulnode: list, randomNumber=3):
    """return co-optimized resources from input

    Args:
    tosearchnode(list) -- the node to search
    usefulnode(list) -- the useful nodes

    Returns:
    [["to_search_node1": ["useful_node1","useful_node2","useful_node3"]],
     ["to_search_node2": ["useful_node1","useful_node2","useful_node3"]],
     ...]
    """

    if checknestedlist(tosearchnode):
        tosearchnode = unielement(tosearchnode)
    if checknestedlist(usefulnode):
        usefulnode = unielement(usefulnode)

    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": 'You are an environmental engineering specialist for regenerative environments. Here are two lists of nodes. \
                    One list includes useful resources to achieve a net-zero environment, and the other list includes resources that are extra and abundant. \n\
                    For each node in the second list, please search in the first list to suggest potential regeneration.\n\
                    Please answer in this format: \n[["to_search_node1":["useful_node1","useful_node2","useful_node3"]],\n\
                    ["to_search_node2": ["useful_node1","useful_node2","useful_node3"]],\n     ...]',
            },
            {
                "role": "user",
                "content": "useful_node: ['RAINWATER', 'ORGANIC EDIBLES', 'ORGANIC MATTER', 'HABITAT PROTECTION', 'SOIL NUTRIENTS', \
                    'WIND ENERGY', 'CARBON SEQUESTRATION', 'ANIMAL FEED', 'WAVES', 'SAND', 'PLANT BIODIVERSITY', 'SEA BREEZES', 'SEA LIFE', \
                    'DISPOSER', 'TOURIST ATTRACTION', 'ROCKS', 'CONSTRUCTION MATERIAL', 'SHELLS', 'EROSION CONTROL', 'SOLAR ENERGY', 'TOPOGRAPHY', \
                    'INDIGENOUS PLANTS', 'IMPROVED HUMAN HEALTH', 'RAINWATER COLLECTING SYSTEMS', 'COASTAL PROTECTION', 'GROUND COVER', 'PHOTOVOLTAIC PANELS', \
                    'NATURAL LIGHTING', 'SHORES', 'SALTWATER', 'BEACH', 'POLLINATORS', 'NUTRIENT EXTRACTION', 'RECYCLABLE', 'REDUCED STORMWATER RUNOFF', \
                    'WIND TURBINES', 'BAMBOO MATERIAL', 'FOOTPRINTS', 'AGRICULTURE', 'SOLAR HOT WATER', 'FOOD SOURCE', 'MARINE BIODIVERSITY', 'WILDLIFE', \
                    'JOB CREATION', 'COMPOST', 'SUNLIGHT', 'GREEN ROOFS', 'CARBON DIOXIDE REDUCTION', 'IRRIGATION', 'THERMAL ENERGY', 'BAMBOO', 'CLEAN AIR', \
                    'SEDIMENT', 'AESTHETIC PLEASURE', 'BIRD SPECIES', 'PLANT SPECIES', 'THERMAL HEATING', 'SOIL', 'ECO-FRIENDLY MATERIALS', 'GARDENS', 'SEAGRASS', \
                    'SUN ENERGY', 'DURABLE GRASS', 'TOURISM', 'SEDUM', 'OCEAN', 'SEAWEED', 'COASTAL ISLAND']\n\n\
                        to_search_node: [\"SHELLS\", \"ANIMAL FEED\"]",
            },
            {
                "role": "assistant",
                "content": '[["SHELLS": ["CONSTRUCTION MATERIAL", "TOURIST ATTRACTION", "COASTAL PROTECTION"]],\n ["ANIMAL FEED": ["ORGANIC MATTER", "COMPOST", "AGRICULTURE"]]]',
            },
            {
                "role": "user",
                "content": f"useful_node: {usefulnode}\nto_search_node: {tosearchnode}",
            },
        ],
        temperature=1,
        max_tokens=4096,
        top_p=1,
        frequency_penalty=0.2,
        presence_penalty=0,
        n=randomNumber)
        output_string = response.choices[0].message.content
        logging.debug(f"genaddfeedback: {output_string}")
        return cleanio(output_string)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


######################################################
######################################################
## exectution
async def return_addinput(output_resources: list, syscolor:dict,  max_tries=3):
    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        flow_list = await genaddinput(output_resources, syscolor, randomNumber=randomNumber)
        if checknestedlist(flow_list):
            return flow_list
    print ("Sorry, we can't generate a result from the output resources, please try again.")
    return None


async def return_addoutput(input_resources: list, sysdict:dict, max_tries=3):
    for i in range(max_tries):
        try:
            randomNumber = i+1
            n=15
            flow_list=[]
            nested_inputs=[input_resources[i:i + n] for i in range(0, len(input_resources), n)]
            
            # Create a list of coroutine tasks for processing each sublist in parallel
            tasks = [genaddoutput(inputlist, sysdict, randomNumber=randomNumber) for inputlist in nested_inputs]
            
            # Run the tasks concurrently
            results = await asyncio.gather(*tasks)
            
            for sub_inputlist in results:
                logging.debug(f"genaddoutput: {sub_inputlist}")
                if checknestedlist(sub_inputlist):
                    flow_list.extend(sub_inputlist)
                    
            if flow_list:
                return flow_list
        except Exception as e:
            continue
    print ("Sorry, we can't generate a result from the input resources, please try again.")
    return None


async def return_addprocess(list_of_io, max_tries=4):
    knowledgelist=[]
    flowlist = []
    tasks = [return_subprocess(io,max_tries) for io in list_of_io]
    
    results = await asyncio.gather(*tasks)
    for knowledge, flow in results:
        if knowledge and flow:
            knowledgelist.extend(knowledge)
            flowlist.extend(flow)
    # unique_tuples = {tuple(item) for item in flowlist}
    # flowquery = [list(tup) for tup in unique_tuples]

    if flowlist:
        return knowledgelist, flowlist
    else:
        print ("Sorry, we can't generate a result from the input resources, please try again.")
        return None, None


async def return_subprocess(io, max_tries=3):
    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        ioknowledge,ioprocess = await genprocess(io, randomNumber=randomNumber)
        logging.debug(f"ioknowledge: {ioknowledge}")
        if checknestedlist(ioprocess):
            return ioknowledge,ioprocess
    logging.debug ("Sorry, we can't generate a result from the input resources, please try again.")
    return None


async def return_addcooptimization(input_resources: list, max_tries=3):
    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        knowstring, flow_list = await genaddcooptimization(input_resources, randomNumber=randomNumber)
        if checknestedlist(flow_list):
            return knowstring, flow_list
    print ("Sorry, we can't generate a result from the input resources, please try again.")
    return None


async def return_addfeedback(toseachnode: list, fullnode: list, max_tries=3):
    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        flow_list = await genaddfeedback(toseachnode, fullnode, randomNumber=randomNumber)
        if checknestedlist(flow_list):
            return flow_list
    print ("Sorry, we can't generate a result from the input resources, please try again.")
    return None


async def return_queryflow_and_nodesys(mode: str, query: list, syscolor:dict, max_tries=3):
    attempts = 0

    while attempts < max_tries:
        if mode == "add-input":
            queryflow = await return_addinput(query, syscolor)
            string= ", ".join(query)
            userinfo = f'More input resources added for {string}.'
        elif mode == "add-output":
            queryflow = await return_addoutput(query, syscolor)
            string= ", ".join(query)
            userinfo = f'More output resources added for {string}.'
        elif mode == "add-process":
            queryknowledge, queryflow = await return_addprocess(query)
            userinfo = f'More process added for flow '
            flowstring = ", ".join(" --> ".join(q) for q in query)
            userinfo += flowstring+'.'
            userinfo+=f'<br>'
            for knowledge in queryknowledge:
                logging.debug(knowledge)
                userinfo += f'<br>{knowledge[0]}'
        elif mode == "add-cooptimization":
            queryknowledge, queryflow = await return_addcooptimization(query)
            string= ", ".join(query)
            userinfo = f'More co-optimization added for {string}.'
            userinfo+=f'<br><br>'
            #replace"/n" with "<br>" in queryknowledge, if there are multiple "\n" like"\n\n", replace with "only one <br>"
            knowledge_formatted = queryknowledge.replace("\n\n", "<br>").replace("\n", "<br>")
            # Now use the formatted string in the f-string without any backslashes in the expression part
            userinfo += f'<br>{knowledge_formatted}'

        else:
            return None

        if queryflow is None or userinfo is None:
            attempts += 1
            continue

        querynodesys = await return_system(queryflow, syscolor)
        logging.debug(f"querynodesys: {querynodesys}")
        # Check if any values are None and retry if so
        if querynodesys is None:
            attempts += 1
            continue
        else:
            return queryflow, querynodesys, userinfo

    # Return None if all attempts fail
    return None


async def return_queryflow_add_feedback(mode: str, query: list, currentflow: list):
    if mode =="add-feedback":
        queryflow = await return_addfeedback(query, currentflow)
        return queryflow

## transform matrix

def return_matrix(mode:str, queriedflow: list, querynodesys: dict, syscolor:dict):
    newmatrix={}
    if mode=="add-input":
        # step 1: categorize a dict according to output
        newinput_dict={}
        for sublist in queriedflow:
            input, output = sublist
            newinput_dict.setdefault(output, []).append(input)

        # step 2: loop through newinput_dict and create a matrix
        offset=0
        for output, inputlist in newinput_dict.items():
            newmatrix[output] = [[1, offset], querynodesys.get(output, "UNKNOWN")]
            for index, input in enumerate(inputlist):
                newmatrix[input] = [[0, offset+index], querynodesys.get(input, "UNKNOWN")]
            offset+=len(inputlist)+1

    if mode=="add-output":
        # step 1: categorize a dict according to input
        newoutput_dict={}
        for sublist in queriedflow:
            input, output = sublist
            newoutput_dict.setdefault(input, []).append(output)

        # step 2: loop through newoutput_dict and create a matrix
        offset=0
        for input, outputlist in newoutput_dict.items():
            newmatrix[input] = [[0, offset], querynodesys.get(input, "UNKNOWN")]
            for index, output in enumerate(outputlist):
                newmatrix[output] = [[1, offset+index], querynodesys.get(output, "UNKNOWN")]
            offset+=len(outputlist)+1

    if mode=="add-process":
        processio_dict={}
        for subquery in queriedflow:
            # subquery includes [i1, p1, p2, p3, o1]
            input = subquery[0]
            process = subquery[1:-1][:3]  # truncate process to 3 if more than 3
            output = subquery[-1]
            if not process: break

            # group according to input
            processio_dict.setdefault(input, []).append([process, output])

        # loop through processio_dict and create a matrix
        offset=0
        for input, processlist in processio_dict.items():
            newmatrix[input] = [[0, offset], querynodesys.get(input, "UNKNOWN")]
            for index, (process, output) in enumerate(processlist):
                for seq, node in enumerate(process, start=1):
                    newmatrix[node] = [[0+seq/10, offset+index], querynodesys.get(node, "UNKNOWN")]
                newmatrix[output] = [[1, offset+index], querynodesys.get(output, "UNKNOWN")]
            offset+=len(processlist)+1

    if mode=="add-cooptimization":
        inputset=set()
        outputset=set()
        for input, output in queriedflow:
            inputset.add(input)
            outputset.add(output)

        sorted_inputlist = sortnode(list(inputset), querynodesys,syscolor)
        sorted_outputlist = sortnode(list(outputset), querynodesys,syscolor)

        for input, output in queriedflow:
            newmatrix[input] = [[0, sorted_inputlist.index(input)], querynodesys.get(input, "UNKNOWN")]
            newmatrix[output] = [[1, sorted_outputlist.index(output)], querynodesys.get(output, "UNKNOWN")]

    return newmatrix     

def sortnode(nodelist: list, nodesys: dict, syscolor:dict):
    """
    group nodelist by system, order them alphabetically according to the system order and then node name
    Args:
    nodelist(list) - list of nodes
    nodesys(dict) - {node:system}
    syscolor(dict) - {system:color}
    Return:
    reordered list of nodes
    """
    # replace nodesys[node] with syscolor[nodesys[node]]
    nodecolor = {node: syscolor[nodesys[node]] for node in nodelist if node in nodesys}
    system_node_pairs = [
        (nodecolor[node], node) for node in nodelist if node in nodesys
    ]
    sorted_pairs = sorted(system_node_pairs)
    sorted_nodelist = [node for system, node in sorted_pairs]
    return sorted_nodelist


######################################################
######################################################
if __name__ == "__main__":
    pass
    # output_resources=["tidal energy","urban soil","concrete","boats"]
    # io=return_addinput(output_resources)
    # print(io)

# def update_flow_and_matrix(
#     queriedflow: list,
#     queriednodesys: dict,
#     currentflow: list,
#     currentmatrix: dict,
#     mode: str,
#     syscolor: dict = defaultsysdict,
# ):
#     """
#         return the updated flow and matrix
#     Avgs:
#         queriedflow(list) - quried flow
#         queriednodesys(dict) - {node:system(str)}
#         currentmatrix(dict) - {node:[x,y](list)}
#         currentflow(list) - list of flowlist
#         mode(str) - "addinput" or "addoutput" or "addprocess" or "addfeedback" or "addcoomptimization"
#         syscolor(dict) - defaultsysdict

#     Returns:
#         (updatedflow, updatedmatrix)
#         updatedflow(list) - a list of flowlist including the newly-added flow
#         updatedmatrix(dict) - {node:[x,y](list)}

#     //if "add-io", [[i1,o1],[i2,o2],...]
#     //if "add-input", flowlist =
#                         [[i1-1,o1], [i1-2,o1], [i1-3,o1], ...,
#                         [i2-1,o2], [i2-2,o2], [i2-3,o2], ...,
#                         [i3-1,o3], [i3-2,o3], [i3-3,o3], ...,]
#                     return - parse list according to o
#                         for [i1-1,o1], [i1-2,o1], [i1-3,o1], ...,
#                         {
#                             i1-1:[0,y1=sortnode],
#                             i1-2:[0,y2=sortnode],
#                             i1-3:[0,y3=sortnode],
#                             o1:[1,round(avg(y1,y2,y3))]
#                             ...
#                         }
#     //if "add-output", flowlist =
#                         [[i1, o1-1], [i1, o1-2], [i1, o1-3], ...,
#                         [i2, o2-1], [i2, o2-2], [i2, o2-3], ...,
#                         [i3, o3-1], [i3, o3-2], [i3, o3-3], ...,]
#                     return - parse list according to i
#                         for [i1, o1-1], [i1, o1-2], [i1, o1-3], ...,
#                         {
#                             i1:[0, round(avg(y1,y2,y3))],
#                             o1-1:[1, y1=sortnode],
#                             o2-1:[1, y2=sortnode],
#                             o3-1:[1, y3=sortnode]
#                             ...
#                         }
#     //if "add-process", [[i1,p1],[i2,p2],...]
#     //if "add-feedback", [[p1,f1],[p2,f2],...]
#     //if "add-coomptimization", [[i1,c1],[i2,c2],...]
#     """

#     if checknestedlist(queriedflow):
#         queriedflow = [[clean(node) for node in templist] for templist in queriedflow]
#     currentmatrix = {clean(key): value for key, value in currentmatrix.items()}
#     queriednodesys = {clean(key): value for key, value in queriednodesys.items()}
#     # common factors for flow
#     updatedflow = mergeflow(queriedflow, currentflow)

#     if mode == "add-feedback":
#         return updatedflow, currentmatrix

#     ################################################################
#     updatedmatrix = currentmatrix.copy()
#     currentnodesys = {node: sys for node, ([coorx, coory], sys) in currentmatrix.items()}
#     combined_nodesys = {**currentnodesys, **queriednodesys}

#     # step 0: categorize a dict according to the coorx of currentnode
#     coorxdict = defaultdict(list)
#     for node, ([coorx, coory], sys) in currentmatrix.items():
#         coorxdict[coorx].append(node)

#     if mode == "add-input":
#         # step 1: categorize a dict according to the coorx of output
#         coorxdict_newinput = defaultdict(list)
#         for sublist in queriedflow:
#             input, output = sublist
#             [coorx, coory], sys = currentmatrix[output]
#             coorxdict_newinput[coorx].append(input)

#         # step 2: loop through coorxdict_newinput
#         for x, nodes in coorxdict_newinput.items():
#             previous_coorx = x - 1
#             previous_nodelist = coorxdict.get(previous_coorx, [])

#             sorted_nodes = sortnode(mergelist(nodes, previous_nodelist), combined_nodesys)
#             for index, node in enumerate(sorted_nodes):
#                 node_sys = queriednodesys.get(node, currentnodesys.get(node))
#                 updatedmatrix[node] = [[previous_coorx, index], node_sys]

#     elif mode == "add-output":
#         # step 1: categorize a dict according to the coorx of input
#         coorxdict_newoutput = defaultdict(list)
#         for sublist in queriedflow:
#             input, output = sublist
#             [coorx, coory], sys = currentmatrix[input]
#             coorxdict_newoutput[coorx].append(output)

#         # step 2: loop through coorxdict_newoutput
#         for x, nodes in coorxdict_newoutput.items():
#             next_coorx = x + 1
#             next_nodelist = coorxdict.get(next_coorx, [])
#             sorted_nodes = sortnode(nodes + next_nodelist, combined_nodesys)
#             for index, node in enumerate(sorted_nodes):
#                 node_sys = queriednodesys.get(node, currentnodesys.get(node))
#                 updatedmatrix[node] = [[next_coorx, index], node_sys]

#     elif mode == "add-process":
#         for subquery in queriedflow:
#             # subquery includes [i1, p1, p2, p3, o1]
#             input = subquery[0]
#             process = subquery[1:-1][:3]  # truncate process to 3 if more than 3
#             output = subquery[-1]
#             if not process: break

#             coors = np.array([value[0] for value in updatedmatrix.values()])
#             x, y = npsearcher(coors, updatedmatrix[input][0])

#             # Update input/output/process node in updatedmatrix
#             updatedmatrix[input] = [[x, y], queriednodesys[input]]
#             updatedmatrix[output] = [[x + 1, y], queriednodesys[output]]

#             for index, node in enumerate(process, start=1):  # start=1 to offset index to match subquery's structure
#                 updatedmatrix[node] = [[x + index / 10, y], queriednodesys[node]]


#         updatedmatrix = refactormatrixy(updatedmatrix) # refactor y-coordinates
#         return updatedflow, updatedmatrix

#     elif mode == "add-cooptimization":
#         # step1 for subquery in queriedflow:
#         # in each subquery,
#         # [[i1,o1],[i2,o1],[i3,o1],...,]
#         ### organize a dictionary according to common output
#         outputdict = defaultdict(list)
#         for subquery in queriedflow:
#             input, output = subquery
#             outputdict[output].append(input)
#         ### find the max coorx of the different inputs
#         ### set the coorx of the output to be max coorx + 1
#         for output, inputlist in outputdict.items():
#             x = max([math.floor(currentmatrix[input][0][0]) for input in inputlist])
#             updatedmatrix[output] = [[x + 1, 0], queriednodesys[output]]
#         updatedmatrix = refactormatrixy(updatedmatrix, True)
#         return updatedflow, updatedmatrix

#     # common factors for dict
#     currentx = [coorx for ([coorx, _], _) in updatedmatrix.values()]
#     mapXdict = mapX(currentx)

#     for node, ((x, y), sys) in updatedmatrix.items():
#         if x in mapXdict:
#             updatedmatrix[node][0][0] = mapXdict[x]
#         else:
#             print(f"No mapping found for x-coordinate: {x}")

#     return updatedflow, updatedmatrix



    # elif mode == "add-process":
    #     for subquery in queriedflow:
    #         # subquery includes [i1, p1, p2, p3, o1]
    #         input = subquery[0]
    #         output = subquery[-1]
    #         if [input, output] not in updatedflow:
    #             updatedflow.append([input, output])
    #             [x1, y1], sys = currentmatrix[input]
    #             updatedmatrix[input] = [[math.floor(x1), math.floor(y1)], sys]
    #             [x2, y2], sys = currentmatrix[output]
    #             updatedmatrix[output] = [[math.floor(x2), math.floor(y2)], sys]


    #     # step 1: categorize a dict according to the input node
    #     # processdict = defaultdict(list)
    #     # for subquery in queriedflow:
    #     #     # subquery includes [i1, p1, p2, p3, o1]
    #     #     input = subquery[0]
    #     #     process = subquery[1:-1][:3]  # truncate process to 3 if more than 3
    #     #     output = subquery[-1]
    #     #     if not process:
    #     #         break
    #     #     processdict[input].append(process)
    #     #     #check current input and output is previously input and output according to its coorx, coory
    #     #     if is_process(currentmatrix[input]) or is_process(currentmatrix[output]):
    #     #         [x1, y1], sys = currentmatrix[input]
    #     #         updatedmatrix[input] = [[math.floor(x1), math.floor(y1)], sys]
    #     #         [x2, y2], sys = currentmatrix[output]
    #     #         updatedmatrix[output] = [[math.floor(x2), math.floor(y2)], sys]

    #     # step 2: refactor y
    #     # only refactor those nodes that coorx is an integer
    #     updatedmatrix = refactormatrixy(updatedmatrix, False)
    #     # step 2: loop through processdict
    #     for input, processlist in processdict.items():
    #         [x, y], sys = currentmatrix[input]
    #         for index, process in enumerate(processlist, start=1):
    #             for seq, node in enumerate(process, start=1):
    #                 updatedmatrix[node] = [
    #                     [x + round((seq / 10), 1), y + round((index / 10), 1)],
    #                     queriednodesys.get(node, "UNKNOWN"),
    #                 ]
    #     return updatedflow, updatedmatrix