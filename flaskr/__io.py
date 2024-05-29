import os
import json
import re
import random
import urllib
from openai import AsyncOpenAI
import asyncio
import aiohttp
from instance.config import OPENAI_API_KEY
client = AsyncOpenAI(api_key=OPENAI_API_KEY)
# defaultsysdict = {
#     "HYDRO": "#0BF",
#     "ENERGY": "#FC0",
#     "SOLID WASTE": "#A75",
#     "TELECOMMUNICATION": "#95A",
#     "TRANSPORT": "#F44",
#     "ECOSYSTEM": "#3C4",
#     "UNKNOWN": "#888",
# }
import logging

# logging.basicConfig(
#     level=logging.DEBUG,
#     filename="./logs/test_logs_io.log",
#     filemode="a",
#     format="%(asctime)s - %(levelname)s - %(message)s",
# )

######################################################
######################################################
# Helper Functions


def clean(input_string, upper=True):
    # "clean a string to make it start with and end only with letter,numbers, or parentheses, and all the cases are upper"
    cleaned_string = re.sub(r"^[^a-zA-Z0-9()]+|[^a-zA-Z0-9()]+$", "", input_string)
    if upper:
        cleaned_string = cleaned_string.upper()
    return cleaned_string


def cleanio(output_string):
    new_string = output_string.strip()[1:-1]
    flowlist = []
    tempflow = extract_brackets(new_string)
    for temp in tempflow:
        # str_input is like "waste water":["fresh water","nutrients"], split it by ":", get ["waste water",["fresh water","nutrients"]]
        flow_str = temp.split(":")
        try:
            templist = extract_quotation(flow_str[1])
        except:
            print(f"{flow_str} for flow {temp} cannot be converted")
            return Exception
        if templist:
            for i in range(len(templist)):
                flow_temp = []
                flow_temp.append(clean(flow_str[0]))
                flow_temp.append(clean(templist[i]))
                flowlist.append(flow_temp)
    return flowlist

def cleaninput(input_string):
    new_string = input_string.strip()[1:-1]
    sysdict={}
    tempflow = extract_brackets(new_string)
    for temp in tempflow:
        # str_input is like "waste water":["fresh water","nutrients"], split it by ":", get ["waste water",["fresh water","nutrients"]]
        flow_str = temp.split(":")
        try:
            templist = extract_quotation(flow_str[1])
        except:
            print(f"{flow_str} for flow {temp} cannot be converted")
            return Exception
        if templist:
            for i in range(len(templist)):
                sysdict[clean(templist[i])]=clean(flow_str[0])
    return sysdict

def cleansystem(sys_string):
    new_string = sys_string.strip()[1:-1]
    systemdict = {}
    tempflow = extract_brackets(new_string)
    for temp in tempflow:
        result = extract_quotation(temp)
        try:
            systemdict[clean(result[0])] = clean(result[1])
        except:
            print(f"{result} for flow {temp} cannot be classified")
            return Exception
    return systemdict

def unielement(flowlist):
    element_set = set()
    # if flowlist contains sublist
    for sublist in flowlist:
        for ele in sublist:
            element_set.add(clean(ele))
    return list(element_set)

def has_letters(string):
    return any(char.isalpha() for char in string)

def extract_brackets(text):
    pattern = (
        r"\[(.*?)\]"  # Regular expression pattern to match strings between "[" and "]"
    )
    matches = re.findall(pattern, text)  # Find all matches of the pattern in the text
    return matches

def extract_curly_brackets(text):
    pattern = (
        r"\{(.*?)\}"  # Regular expression pattern to match strings between "{" and "}"
    )
    matches = re.findall(pattern, text)  # Find all matches of the pattern in the text
    return matches

def extract_quotation(text):
    matches = re.findall(r"\'(.*?)\'", text)
    if len(matches) == 0:
        matches = re.findall('"(.*?)"', text)
    return matches

def checkjson(jsonfile):
    # open a json file from the path
    with open(jsonfile) as f:
        data = json.load(f)
        # check if the json file contains no letters
        return has_letters(str(data))

def checknestedlist(nestedlist):
    # If nestedlist is None or not a list or is empty, return False
    if not nestedlist or not isinstance(nestedlist, list) or len(nestedlist) == 0:
        return False

    # Check each element in each sublist for letters
    for sublist in nestedlist:
        if sublist is None or not isinstance(sublist, list):
            return False
        if not any(has_letters(str(ele)) for ele in sublist):
            return False

    return True


def checklist(input):
    # Check if input is None or not a list, return False
    if input is None or not isinstance(input, list):
        return False
    return True


def checkdict(sysdict):
    # Check if dict is None or not a dictionary, return False
    if sysdict is None or not isinstance(sysdict, dict):
        return False
    return True


def sortnode(nodelist, nodesys, syscolor):
    """
    group nodelist by system, order them alphabetically according to the system order and then node name
    Args:
        nodelist(list) - list of nodes
        nodesys(dict) - {node:system}
        syscolor(dict) - {system:color}
    Return:
        reordered list of nodes
    """
    nodecolor = {node: syscolor[nodesys[node]] for node in nodelist if node in nodesys}
    system_node_pairs = [
        (nodecolor[node], node) for node in nodelist if node in nodesys
    ]
    sorted_pairs = sorted(system_node_pairs)
    sorted_nodelist = [node for system, node in sorted_pairs]
    return sorted_nodelist


######################################################
######################################################
# Task 2.1 - Minimum Version of Flow Generation
# Generate input from environment description


async def geninput(
    envir_description: str,
    sysdict: dict,
    randomNumber=3,
):
    """return unique input from environment description"""
    try:
        response = await client.chat.completions.create(model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"You will extract and imagine potential resources in the environment description of various systems as keywords. \
                            The resources include potential components, objects, materials, organisms, and even chemicals. \
                            Please provide me with 40 resources in total.Please ensure a minimum of five resources for each system provided and don't have too many in one system. ",
            },
            {
                "role": "user",
                "content": f'environment: "This scene depicts an agricultural village in the mountains. There are a couple flood valleys with turbulent water. \
                                                To empower this village, there are some windfarms nearby. Cheetahs in the mountains need to be preserved. \
                                                Food and potable water can be very valuable here."\
                                system: ["ecosystem", "hydro", "energy"]',
            },
            {
                "role": "assistant",
                "content": f'[["ecosystem":["Crops", "Soil", "Cheetahs", "Mountain terrain", "Wildlife", "Rocks", "Seeds", "Fertilizers", "Herbal plants", "Berries", "Clay", "Sand", "Compost", "Pollinators", "Fungi", "Earthworms"]]\
                    ["hydro":["Fresh Water", "Flood valleys", "Turbulent water", "Irrigation systems", "Streams", "Natural springs", "Aquifers", "Rainwater", "Vadose wells", "Potable water"]]\
                    ["energy":["Wind", "Wind turbines", "Sunlight", "Solar panels", "Firewood", "Timber"]]]',
            },
            {
                "role": "user",
                "content": f"environment: 'This is an urban plaza with tech events and livehouse.' \
                                system: [food, economy, mobility]",
            },
            {
                "role": "assistant",
                "content": f'[["food":["Food trucks","Local cuisine","Food stalls","Fresh produce","Spices","Seasonings","Beverages","Desserts","Street food","Food vendors","Food festivals","Urban farms"]],\
                    ["economy":["Tech events","Livehouse","Local markets","Artisan crafts","Cultural shops","Smart kiosks","Handmade goods","Organic produce","Locally sourced materials", "Amphitheaters"]],\
                    ["mobility":["Bicycles","Scooters","Electric vehicles","Pedestrian walkways","Public transportation","Bike lanes","Car-sharing services","Ride-hailing services"]]]',
            },
            {
                "role": "user",
                "content": f"environment: 'This area displays a lush mangrove forest, where roots dive deep into the brackish waters. Brightly colored crabs scuttle about, and the chirping of unseen insects is constant. Fishermen navigate through channels casting nets in a dance as old as time.' \
                                system: '[food, economy, mobility]'",
            },
            {
                "role": "assistant",
                "content": f'[["food":["Crabs", "Fish", "Shrimp", "Mussels", "Seaweed", "Local Cuisine", "Lobsters"]], \
                             ["economy":["Eco-tourism initiative", "Kayak and canoe rentals", "Aquaculture", "Piers and docks improvement", "Mangrove research center", "Seasonal fishing training", "Bait Nets", "Fishermen"]],\
                             ["mobility":["Boats", "Canoes", "Ferryboats", "Sails", "Paddles"]]]',
            },
            {
                "role": "user",
                "content": f"environment: 'This is a biophilic boulevard for monarch and Latinos.' \
                                system: '[biosystem, economy, community]'",
            },
            {
                "role": "assistant",
                "content": f'[["biosystem":["Monarch butterflies", "Milkweeds", "Shrubs", "Flowers", "Pollinators", "Soil", "Sunshine", "Rainwater", "Mulch", "Compost", "Fallen leaves", "Garden beds", "Fresh herbs"]],\
    ["economy":["Artisan crafts", "Food vendors", "Local markets", "Cultural shops", "Artwork", "Handmade goods", "Organic produce", "Locally sourced materials"]],\
    ["community":["Community gardens", "Latino festivals", "Murals", "Gathering spaces", "Play areas", "Affordable Housing", "Parklets for community", "Latino crafts", "Conservation awareness", "Latin American art"]]\
]'

            },
            {
                "role": "user",
                "content": f"environment:'{envir_description}',\
                                system:'{list(sysdict.keys())}'",
            },
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        n=randomNumber)
        input_resources = response.choices[0].message.content
        inputdic_sys = cleaninput(input_resources)
        return list(inputdic_sys.keys()), inputdic_sys
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


async def gensystem(node:list, sysinfodict:dict, randomNumber=3):
    """return system classification of elements"""
    uniquesys = list(set(sysinfodict.keys()))
    try:
        response = await client.chat.completions.create(model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": f"""You are an encyclopedia. Your job is to classify the node list into system.\n
                    Output in this format: [["node1","system1"],["node2","system2"]]""",
            },
            {
                "role": "user",
                "content": 'nodelist: ["Cheetah", "wildlife corridors", "wadis"], system:["HYDRO", "ECOSYSTEM"]',
            },
            {
                "role": "assistant",
                "content": '[["Cheetah","ECOSYSTEM"], ["wildlife corridors","ECOSYSTEM"], ["wadis", "HYDRO"]]',
            },
            {
                "role": "user",
                "content": 'nodelist: ["forest", "irrigation", "organic waste", "biofuel"], system:["HYDRO", "ECOSYSTEM", "SOLID WASTE","ENERGY"]',
            },
            {
                "role": "assistant",
                "content": '[["forest","ECOSYSTEM"], ["irrigation","HYDRO"], ["organic waste", "SOLID WASTE"], ["biofuel", "ENERGY"]]',
            },
            {"role": "user", "content": f"nodelist:{node}, system:{uniquesys}"},
        ],
        temperature=1,
        max_tokens=4096,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0)
        data = response.choices[0].message.content
        logging.debug(f"Data: {data}")
        return cleansystem(data)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


## exectution
async def return_input(env:str, sysdict:dict, max_tries=3):
    for _ in range(max_tries):
        try:
            input_val, input_sys = await geninput(env, sysdict)
            logging.debug(f"input_val: {input_val}, input_sys: {input_sys}")
            if checklist(input_val):
                return input_val, input_sys
        except:
            print("Sorry, we can't generate a result from the environment description, please try again.")
    return None


# def return_io(input_resources, sysdict:dict, max_tries=4):
#     for i in range(max_tries):
#         flow_list = genio(input_resources, sysdict, i+1)
#         print(f"flow_list: {flow_list}")
#         if checknestedlist(flow_list):
#             return flow_list
#     print("Sorry, we can't generate a result from the input resources, please try again.")
#     return None



async def return_system(node: list, syscolor: dict, max_tries: int = 3, known_nodesys: dict = None):
    """_summary_

    Args:
        node (list): _description_
        syscolor (dict): _description_
        max_tries (int, optional): _description_. Defaults to 3.
        known_nodesys (dict, optional): nodes that come with a system from other steps. Defaults to None.
    """
    if checknestedlist(node):
        node = unielement(node)
        
    if known_nodesys:
        # Filter out known_nodesys.keys() from node
        known_nodelist = list(known_nodesys.keys())
        node = [ele for ele in node if ele not in known_nodelist]
        
    # Split the node into list of length n, and store in a nested list
    n = 75
    nested_node = [node[i:i + n] for i in range(0, len(node), n)]
    logging.debug(f"Nested node: {nested_node}")
    sysdict = {}

    # Create a list of coroutine tasks for processing each sublist in parallel
    tasks = [return_sub_system(sublist, syscolor) for sublist in nested_node]
    
    # Run the tasks concurrently
    results = await asyncio.gather(*tasks)
    
    for sublist, sub_sysdict in zip(nested_node, results):
        if sub_sysdict:  # Ensure sub_sysdict is not None
            sysdict.update(sub_sysdict)
                
    if known_nodesys:
        sysdict.update(known_nodesys)
    
    return sysdict    
        
async def return_sub_system(sub_nodelist: list, syscolor: dict, max_tries: int = 3):
    """
    Attempts to generate a system dictionary for a sublist of nodes.

    Args:
        sub_nodelist (list): Sublist of nodes to process.
        syscolor (dict): Dictionary mapping systems to colors.
        max_tries (int, optional): Maximum number of attempts to generate a system. Defaults to 3.

    Returns:
        dict: Dictionary mapping nodes to systems if successful, otherwise None.
    """
    for attempt in range(max_tries):
        try:
            random_number = random.randint(1, 5)
            logging.debug(f"Attempt {attempt + 1} to generate system for {sub_nodelist}")
            sub_sysdict = await gensystem(sub_nodelist, syscolor, random_number)
            logging.debug(f"Trying Gen Sub system dictionary: {sub_sysdict}")
            if checkdict(sub_sysdict):
                set_sub_sysdict = set(syscolor.keys())
                # set_sub_sysdict.add("UNKNOWN")
  
                if set(sub_sysdict.keys()) != set(sub_nodelist):
                    logging.debug(f"Sublist {sub_nodelist} does not match system dictionary {sub_sysdict}")
                    #get the difference between the two sets
                    diff = set(sub_nodelist) - set(sub_sysdict.keys())
                    logging.debug(f"Missing nodes: {diff}")
                    #if sub_nodelist is smaller than sub_sysdict, remove the extra nodes from sub_sysdict
                    if len(sub_nodelist) < len(sub_sysdict):
                        for node in diff:
                            sub_sysdict.pop(node)
                    else:
                        #if sub_nodelist is larger than sub_sysdict, add the missing nodes to sub_sysdict with "UNKNOWN" system
                        for node in diff:
                            sub_sysdict[node] = "UNKNOWN"
                    
                if set(sub_sysdict.values()).issubset(set_sub_sysdict):
                    #find the key that has the value that is not in the set_sub_sysdict
                    for key, value in sub_sysdict.items():
                        if value not in set_sub_sysdict:
                            sub_sysdict[key] = "UNKNOWN"
                return sub_sysdict
        except Exception as e:
            logging.error(f"Error during system generation on attempt {attempt + 1}: {e}")
    return None

# ### Build Simple Matrix
def nodematrix(nodelist, nodesys, syscolor):
    listin = set()
    listout = set()

    for sublist in nodelist:
        ele0, ele1 = sublist  # Unpack elements for readability
        listin.add(ele0)
        if ele1 not in listin:
            listout.add(ele1)

    listinput = sortnode(list(listin), nodesys, syscolor)
    listoutput = sortnode(list(listout - listin), nodesys, syscolor)

    nodematrix = {}
    for n in listinput:
        nodematrix[n] = [0, listinput.index(n)], nodesys[n]
    for n in listoutput:
        nodematrix[n] = [1, listoutput.index(n)], nodesys[n]
    return nodematrix


######################################################
######################################################
if __name__ == "__main__":
    pass
    # env = "this is an urbran plaza"
    # input_val = return_input(env)
    # # print(input_val)
    # flow_list = return_io(input_val)
    # # print(flow_list)
    # node=unielement(flow_list)
    # # print(node)
    # sysdict={"hydro":"rgba(0, 174, 239, 0.8)", "energy":"rgba(255, 198, 11, 0.8)",
    #         "solidwaste":"rgba(0, 166, 81, 0.8)", "food":"rgba(0, 114, 41, 0.8)",
    #         "transport":"rgba(185, 29, 71, 0.8)","ecosystem":"rgba(57, 181, 74, 0.8)",
    #         "unknown":"rgba(191, 191, 191, 0.8)",}
    # nodesysdict=return_system(node,sysdict)
    # print(nodesysdict)


# def genio(input_resources, sysdict:dict, randomNumber=3):
#     """return output resources from input resources"""
#     sys_string = ", ".join(list(sysdict.keys())).upper()
#     try:
#         response = openai.ChatCompletion.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": """You are a sustainabilty specialist, given the input resources, please come up with output resources. 
#             These output resources are values and helpful optimize the environmental process to achive net-zero and net-positive vision for these systems: {sys_string}. Please come up with two to three output for each input.

#             I will ask in this list format:["input1","input2","input3"], such as ["waste water", "organic waste", "wind energy"].
#             Step 1, think for each input in the list, such as "waste water" can generate "fresh water" and "nutrients".
#             Step 2, please also try multiple inputs to co-optimize, such as "waste water" and "organic waste" can be combined in digestor to generate "biofuel".
#             Please answer in this list format, please put the co-optimized output in each input list, such as:
#             [  ["input1":["output1","output2","co-optimized output3"]],
#                 ["input2":["output1","output2","co-optimized output3"]],
#                 ["input3":["output1","output2"]], ]""",
#                 },
#                 {
#                     "role": "user",
#                     "content": """["waste water", "organic waste", "wind energy"]""",
#                 },
#                 {
#                     "role": "assistant",
#                     "content": """[["waste water":["fresh water","nutrients","biofuel"]], ["organic waste":["biofuel"; "biogas"]], ["wind":["electricity","humidity"]]]""",
#                 },
#                 {"role": "user", "content": """["salt water", "organics"]"""},
#                 {
#                     "role": "assistant",
#                     "content": """ [["salt water":["NaCl","fresh water"]], ["organic waste":["biofuel","biogas"]]]""",
#                 },
#                 {
#                     "role": "user",
#                     "content": """["wetland", "non-potable water storage"]""",
#                 },
#                 {
#                     "role": "assistant",
#                     "content": """ [["wetland":"irrigation"], ["non-potable water storage":["irrigation","water treatment"]]]""",
#                 },
#                 {"role": "user", "content": str(input_resources)},
#             ],
#             temperature=1,
#             max_tokens=4096,
#             n=randomNumber
#         )
#         output_string = response["choices"][0]["message"]["content"]

#         return cleanio(output_string)
#     except Exception as e:  # This catches all exceptions
#         print(f"An error occurred: {e}")
#         return None
