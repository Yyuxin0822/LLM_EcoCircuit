import os
import json
import re
import random
import urllib
import openai
import ast

from flaskr.config import OPENAI_API_KEY
openai.api_key = OPENAI_API_KEY

defaultsysdict = {
    "HYDRO": "#0BF",
    "ENERGY": "#FC0",
    "SOLID WASTE": "#A75",
    "TELECOMMUNICATION": "#95A",
    "TRANSPORT": "#F44",
    "ECOSYSTEM": "#3C4",
    "UNKNOWN": "#888",
}


######################################################
######################################################
# Helper Functions


def clean(input_string):
    # "clean a string to make it start with and end only with letter,numbers, or parentheses, and all the cases are upper"
    cleaned_string = re.sub(r"^[^a-zA-Z0-9()]+|[^a-zA-Z0-9()]+$", "", input_string)
    return cleaned_string.upper()


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
            continue
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


def sortnode(nodelist, nodesys, syscolor=defaultsysdict):
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


def geninput(
    envir_description,
    syslist=[
        "HYDRO",
        "ENERGY",
        "SOLID WASTE",
        "TELECOMMUNICATION",
        "TRANSPORT",
        "ECOSYSTEM",
    ],
    randomNumber=3,
):
    """return unique input from environment description"""
    systring = ", ".join(syslist).lower()
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a environmental engineering specialist, you will extract and imagine potential resources in the environment description as keywords. The resources in the environment include potential organisms, chemicals, materials; and they come from various systems, such as {systring}. Please try to imagine as many as possible, and provide me around 40 in total.\n\n",
                },
                {
                    "role": "user",
                    "content": "This scene depicts an agricultural village in the mountains. There are a couple flood valleys with turbulent water.  To empower this village, there are some windfarms nearby. Cheetahs in the mountains need to be preserved. Food and potable water can be very valuable here.",
                },
                {
                    "role": "assistant",
                    "content": "cheetah, fresh water, wind, biomass, groundwater, wild herbs, flora, potable water, irrigation water, mountain soil, spring water, timber, medicine plants, granite, geothermal energy",
                },
                {
                    "role": "user",
                    "content": "This area displays a lush mangrove forest, where roots dive deep into the brackish waters. Brightly colored crabs scuttle about, and the chirping of unseen insects is constant. Fishermen navigate through channels, casting nets in a dance as old as time.",
                },
                {
                    "role": "assistant",
                    "content": "mangrove trees, brackish water, crabs, insects, fish, fishermen, channels, nets, marine life, biodiversity, oysters, algae, tidal energy, medicinal plants, shrimp, seagrass, salt, wood, mud, plankton, microorganisms, bird nests, pelicans, shellfish, coral reefs, sand, silt, phosphates, estuary, larva, turtles, seahorses, moss, roots, fruits",
                },
                {
                    "role": "user",
                    "content": envir_description,
                },
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            n=randomNumber,
        )
        input_resources = response["choices"][0]["message"]["content"].split(",")
        unique_input = list(set(clean(i) for i in input_resources))
        return unique_input
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


def genio(input_resources, randomNumber=3):
    """return output resources from input resources"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """You are a environmental engineering specialist, given the input resources, please come up with output resources. 
            These output resources are values and helpful optimize the environmental process to achive net zero energy, net zero carbon, and net positive water systems. Please come up with two to three output for each input.
            
            I will ask in this list format:["input1","input2","input3"], such as ["waste water", "organic waste", "wind energy"].
            Step 1, think for each input in the list, such as "waste water" can generate "fresh water" and "nutrients".
            Step 2, please also try multiple inputs to co-optimize, such as "waste water" and "organic waste" can be combined in digestor to generate "biofuel".
            Please answer in this list format, please put the co-optimized output in each input list, such as:
            [  ["input1":["output1","output2","co-optimized output3"]],
                ["input2":["output1","output2","co-optimized output3"]],
                ["input3":["output1","output2"]], ]""",
                },
                {
                    "role": "user",
                    "content": """["waste water", "organic waste", "wind energy"]""",
                },
                {
                    "role": "assistant",
                    "content": """[["waste water":["fresh water","nutrients","biofuel"]], ["organic waste":["biofuel"; "biogas"]], ["wind":["electricity","humidity"]]]""",
                },
                {"role": "user", "content": """["salt water", "organics"]"""},
                {
                    "role": "assistant",
                    "content": """ [["salt water":["NaCl","fresh water"]], ["organic waste":["biofuel","biogas"]]]""",
                },
                {
                    "role": "user",
                    "content": """["wetland", "non-potable water storage"]""",
                },
                {
                    "role": "assistant",
                    "content": """ [["wetland":"irrigation"], ["non-potable water storage":["irrigation","water treatment"]]]""",
                },
                {"role": "user", "content": str(input_resources)},
            ],
            temperature=1,
            n=randomNumber,
        )
        output_string = response["choices"][0]["message"]["content"]
        return cleanio(output_string)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


def gensystem(node, sysinfodict, randomNumber=3):
    """return system classification of elements"""
    uniquesys = list(set(sysinfodict.keys()))
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an encyclopedia. Your job is to classify the node list into the following category: {uniquesys}.\n
                    Output in this format: [["node1","system1"],["node2","system2"]]""",
                },
                {
                    "role": "user",
                    "content": '["Cheetah", "wildlife corridors", "wadis"]',
                },
                {
                    "role": "assistant",
                    "content": '[["Cheetah","ECOSYSTEM"], ["wildlife corridors","ECOSYSTEM"], ["wadis", "HYDRO"]]',
                },
                {
                    "role": "user",
                    "content": '["forest", "irrigation", "organic waste", "biofuel"]',
                },
                {
                    "role": "assistant",
                    "content": '[["forest","ECOSYSTEM"], ["irrigation","HYDRO"], ["organic waste", "SOLID WASTE"], ["biofuel", "ENERGY"]]',
                },
                {"role": "user", "content": f"{node}"},
            ],
            temperature=1,
            max_tokens=4096,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )
        data = response["choices"][0]["message"]["content"]
        return cleansystem(data)
    except Exception as e:  # This catches all exceptions
        print(f"An error occurred: {e}")
        return None


## exectution
def return_input(env, max_tries=3):
    for _ in range(max_tries):
        input_val = geninput(env)
        if checklist(input_val):
            return input_val
    return "Sorry, we can't generate a result from the environment description, please try again."


def return_io(input_resources, max_tries=4):
    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        flow_list = genio(input_resources, randomNumber)
        if checknestedlist(flow_list):
            return flow_list
    return (
        "Sorry, we can't generate a result from the input resources, please try again."
    )


def return_system(node: list, syscolor: dict = defaultsysdict, max_tries: int = 3):
    if checknestedlist(node):
        node = unielement(node)

    for _ in range(max_tries):
        randomNumber = random.randint(1, 5)
        sysdict = gensystem(node, syscolor, randomNumber)
        if checkdict(sysdict):
            try:
                if set(sysdict.keys()) == set(node) and set(sysdict.values()).issubset(
                    set(syscolor.keys())
                ):
                    return sysdict
            except:
                print(f"sysdict keys {sysdict.keys()} and node {node} are not the same")
    return "Sorry, we can't generate a result for the nodes, please try again."


# ### Build Simple Matrix
def nodematrix(nodelist, nodesys):
    listin = set()
    listout = set()

    for sublist in nodelist:
        ele0, ele1 = sublist  # Unpack elements for readability
        listin.add(ele0)
        if ele1 not in listin:
            listout.add(ele1)

    listinput = sortnode(list(listin), nodesys)
    listoutput = sortnode(list(listout - listin), nodesys)

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
