from flask import (
    Blueprint,
    flash,
    g,
    redirect,
    render_template,
    request,
    url_for,
    jsonify,
    current_app,
)

from werkzeug.exceptions import abort
from werkzeug.utils import secure_filename
from flaskr.auth import login_required
from flaskr.db import get_db
from flaskr.__img import *
from flaskr.__io import *
from flaskr.__addinput import *
# from flaskr.errorhandler import *
import os
import urllib
import json
from io import BytesIO
from flask_socketio import SocketIO, send, emit
from . import socketio
import asyncio
from aiohttp import ClientSession
import logging


logging.basicConfig(
    level=logging.DEBUG,
    filename="./logs/test_debug_errorlog.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
)

bp = Blueprint("project", __name__)

@bp.before_request
def set_test_user():
    if current_app.config["TESTING"]:
        g.user = {"id": 1, "username": "testuser"}


#################generate.html################
##############################################
@bp.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if g.user is None:
            return redirect(url_for('auth.signin'))
        else:
            return redirect(url_for('project.prompt'))
    return render_template("index.html")


# (C)index  - prompting the user three ways of entering data
@bp.route("/prompt", methods=("GET", "POST"))
@login_required
def prompt():
    if request.method == "POST":
        logging.debug("New test started!")
        filepath = os.path.join(current_app.instance_path, "images/envir.jpg")
        max_project_id = get_max_project_id()
        max_prompt_id = get_max_prompt_id()

        async def handle_request():
            async with ClientSession() as session:
                requesttype = request.form["requesttype"]
                system = request.form["system"]
                
                async def process_description_or_label(info):
                    imgurl_task = IndexHelper.gen_canvas((max_project_id + 1), info, filepath)
                    genio_task = IndexHelper.genio_from_description((max_prompt_id + 1), (max_project_id + 1), info, json.loads(system))
                    return await asyncio.gather(imgurl_task, genio_task)
                
                if requesttype == "description":
                    promptuser = request.form["description"]
                    expand = request.form["expand"]
                    info = IndexHelper.gen_from_description(promptuser, expand)
                    imgurl, genio_result = await process_description_or_label(info)
                elif requesttype == "label":
                    promptuser = request.form["label"]
                    info = IndexHelper.gen_from_label(promptuser)
                    imgurl, genio_result = await process_description_or_label(info)
                elif requesttype == "image":
                    if request.files:
                        file = request.files["image"]
                        if file.filename == "":
                            return "No selected file"
                        if file:
                            file.save(filepath)
                            promptuser = "Untitled"
                            imgurl, info = await IndexHelper.gen_from_image(
                                (max_project_id + 1), filepath
                            )
                    await IndexHelper.genio_from_description(
                        (max_prompt_id + 1), (max_project_id + 1), info, json.loads(system)
                    )
                return imgurl, info, promptuser, system, requesttype

        imgurl, info, promptuser, system, requesttype = asyncio.run(handle_request())
        logging.debug(max_prompt_id + 1)
        error = None

        if imgurl is None or info is None:
            error = "Generation error, please try again."
            flash(error)
            return render_template("project/prompt.html"), 400
        else:
            if isinstance(info, list):
                info = ", ".join(info)  # info as list is used for label
                
            # system_json = json.dumps(system)
            # logging.debug(f"Prompt: {promptuser}, type: {type(promptuser)}")
            # logging.debug(f"Info: {info}, type: {type(info)}")
            # logging.debug(f"Image URL: {imgurl}, type: {type(imgurl)}")
            # logging.debug(f"system: {system_json}, type: {type(system_json)}")
            # print (type(requesttype))
            # logging.debug(f"Request Type: {requesttype}", type(requesttype))
            
            db = get_db()
            cursor = db.cursor()
            cursor.execute(
                "INSERT INTO project (author_id, title, type, info, img_url, system) \
                VALUES (?, ?, ?, ?, ?, ?)",
                (g.user["id"], promptuser, requesttype, info, imgurl, system),
            )
            db.commit()
            project_id = cursor.lastrowid
            return redirect(url_for("project.generate", id=project_id))

    return render_template("project/prompt.html")


# (R)
@bp.route("/<int:id>", methods=["GET", "POST"])
@login_required
def generate(id):
    project = get_project(id)
    return render_template("project/generate.html", project=project, id=id)


# (U)
@bp.route("/addio", methods=["POST"])
@login_required
def addio():
    data = request.get_json()
    # print("type of data: ", (data["sysdict"]))
    # print("type of data: ", type(json.loads(data["sysdict"])))
    
    prompt_id = get_max_prompt_id() + 1
    prompt_id = asyncio.run(IndexHelper.genio_from_description(
        prompt_id, data["project_id"], data["info"], json.loads(data["sysdict"])
    ))
    if prompt_id is None:
        error = "Gereration error, please ask again."
        flash(error)
        return 400
    return jsonify(
        {
            "status": "success",
            "project_id": data["project_id"],
            "prompt": get_prompt(prompt_id),
        }
    )


# (U)
@bp.route("/quickgen", methods=["POST"])
@login_required
def quickgen():
    """
    data received includes the for each prompt:
        mode, prompt_id, promptquery
    Args:

    Returns:
        _type_: _description_
    """
    data = request.get_json()
    mode = data["mode"]
    prompt_id_list = data["prompt_id_array"]
    info_list = data["info_array"]

    prompt_id = asyncio.run(update(mode, prompt_id_list, info_list, json.loads(data["sysdict"])))
    if prompt_id is None:
        error = "Gereration error, please ask again."
        flash(error)
        return 400
    else:
        return jsonify({"status": "success"})


# (U)
@bp.route("/regen-image", methods=["POST"])
@login_required
def regen_image():  
    data = request.get_json()
    filepath = os.path.join(current_app.instance_path, "images/envir.jpg")
    imgurl,tempurl= update_img_sync(data["project_id"], filepath, data["info"])
    if imgurl is None:
        error = "Gereration error, please ask again."
        flash(error)
        return 400
    return jsonify({"status": "success", "imgurl": tempurl})

def update_img_sync(project_id, filepath, info):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    imgurl, tempurl = loop.run_until_complete(update_img(project_id, filepath, info))
    loop.close()
    return imgurl, tempurl   

# (UD)
@socketio.on("save_prompt")
def save_prompt(data):
    """_summary_

    Returns:
        _type_: _description_
    """
    # print("Saved data to prompt: ", data)
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE prompt
        SET flow = ?,
            node = ?,
            feedbackflow = ?
        WHERE id = ?
        """,
        (
            json.dumps(data["flow"]),  # Serialize the flow data to a JSON string
            json.dumps(data["node"]), 
            json.dumps(data["feedbackflow"]),
            data["prompt_id"],  # The ID for the record to update
        ),
    )

    db.commit()
    return data["prompt_id"]


# (UD)
@socketio.on("save_system")
def save_system_to_project(data):
    # print("Saved data to project: ", data)
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE project
        SET system = ?
        WHERE id = ?
        """,
        (
            json.dumps(data["system"]),  # Serialize the node data to a JSON string
            data["project_id"],  # The ID for the record to update
        ),
    )

    db.commit()
    return data["project_id"]


# (U)
@socketio.on("save_info")
def save_info_to_project(data):
    # print("Saved data to project: ", data)
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE project
        SET info = ?
        WHERE id = ?
        """,
        (
            data["info"],  # Serialize the node data to a JSON string
            data["project_id"],  # The ID for the record to update
        ),
    )

    db.commit()
    return data["project_id"]

# (U)
@socketio.on("save_title")
def save_info_to_project(data):
    # print("Saved data to project: ", data)
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE project
        SET title = ?
        WHERE id = ?
        """,
        (
            data["title"],  # Serialize the node data to a JSON string
            data["project_id"],  # The ID for the record to update
        ),
    )

    db.commit()
    return data["project_id"]

# (U) promptcanvas
@bp.route('/save_promptcanvas', methods=['POST'])
def save_promptcanvas():
    # print("Save prompt canvas")
    #save this image to instance/promptcanvas
    try:
        prompt_id = request.form['prompt_id']
        file = request.files['data_url']
        
        image = Image.open(file.stream)
        filename = f'promptcanvas_{prompt_id}.png'
        filepath = os.path.join(current_app.instance_path, "promptcanvas", filename)
        
        # Save the image
        image.save(filepath)
        # print(f"Image dimensions: {image.size}")
        #save the image url to the database
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            UPDATE prompt
            SET promptcanvas = ?
            WHERE id = ?
            """,
            (
                filename,
                int(prompt_id),  # The ID for the record to update
            ),
        )
        db.commit()
        return jsonify({'success': True, 'message': 'Canvas saved successfully.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    
# (U) promptcanvas
@bp.route('/load_promptcanvas', methods=['POST'])
def load_promptcanvas():
    try:
        prompt_id = request.get_json()['prompt_id']

        # print("Prompt ID: ", prompt_id)
        #retrieve filepath from the database
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            SELECT promptcanvas
            FROM prompt
            WHERE id = ?
            """,
            (prompt_id,)
        )
        row = cursor.fetchone()
        print("Row: ", row)
        print("Row[0]: ", row[0])
        if row is None:
            return jsonify({'success': True, 'message': 'No canvas found.'}), 200
        if row[0] is None:
            return jsonify({'success': True, 'message': 'No canvas found.'}), 200
        filename =os.path.join(current_app.instance_path, "promptcanvas", row[0])
        if filename is None or not os.path.exists(filename):
            return jsonify({'success': True, 'message': 'No canvas found.'}), 200
        # Read the file and encode it in base64
        with open(filename, 'rb') as f:
            data = f.read()
        data_url = f'data:image/png;base64,{base64.b64encode(data).decode()}'
        return jsonify({'success': True, 'data_url': data_url}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@bp.route("/delete/<int:id>", methods=("POST",))
@login_required
def delete(id):
    get_project(id)
    db = get_db()
    db.execute("DELETE FROM post WHERE id = ?", (id,))
    db.commit()
    return redirect(url_for("project.index"))


#################custom.html###################
###############################################
@bp.route("/custom/<int:id>", methods=("GET", "POST"))
@login_required
def custom(id):
    # id here is project_id but not prompt_id
    customproject = get_customproject(id)
    # project = get_project(id)
    return render_template("project/custom.html", customproject=customproject, id=id)


@socketio.on("send_data_to_custom")
def savetocustom(data):
    """
    data received includes prompy_id, query_array
    """
    # print('Received data:', data)

    project_id = int(data["project_id"])
    flow_array = data["flow_array"]
    node_array = data["node_array"]

    #pass the nodes and flows to the custom
    emit("data_from_playground", {'project_id':project_id,"flow": flow_array, "node": node_array}, broadcast=True)
    #code to make sure that the data is saved when received in the custom

# (U) customcanvas
@bp.route('/save_customcanvas', methods=['POST'])
def save_customcanvas():
    logging.debug("Save custom canvas")
    #save this image to instance/promptcanvas
    try:
        data_url = request.form['data_url']
        custom_id = request.form['custom_id']
        # print("Saved data to promptcanvas: ", data_url)
        image_data = base64.b64decode(data_url.split(',')[1])
        image = Image.open(BytesIO(image_data))
        filename = f'customcanvas_{custom_id}.png'
        image.save(os.path.join(current_app.instance_path, "customcanvas", filename))
        
        #save the image url to the database
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            UPDATE customprompt
            SET canvas = ?
            WHERE id = ?
            """,
            (
                filename,
                custom_id,  # The ID for the record to update
            ),
        )
        db.commit()
        return jsonify({'success': True, 'message': 'Canvas saved successfully.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


# (U) customcanvas
@bp.route('/load_customcanvas', methods=['POST'])
def load_customcanvas():
    # pass
    try:
        custom_id = request.get_json()['custom_id']
        #retrieve filepath from the database
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            SELECT canvas
            FROM customprompt
            WHERE id = ?
            """,
            (custom_id,)
        )
        row = cursor.fetchone()

        if row is None:
            return jsonify({'success': True, 'message': 'No canvas found.'}), 200
        filename =os.path.join(current_app.instance_path, "customcanvas", row[0])
        # logging.debug ("Filename: ", filename)
    
        if filename is None or not os.path.exists(filename):
            return jsonify({'success': True, 'message': 'No canvas found.'}), 200
        # Read the file and encode it in base64
        with open(filename, 'rb') as f:
            data = f.read()
        data_url = f'data:image/png;base64,{base64.b64encode(data).decode()}'
        return jsonify({'success': True, 'data_url': data_url}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


# (U) 
@bp.route('/save_custom', methods=['POST'])
def save_custom_view(data):
    """_summary_

    Args:
        prompt_id_array (list): _description_
        query_array (list): _description_
        syscolor (dict[str, any], optional): _description_. Defaults to defaultsysdict.

    Returns:
        _type_: _description_
    """
    # print("Saved data to custom: ", data)
    customprompt_id = int(data["prompt_id"])
    project_id = customprompt_id

    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO customprompt (id, flow, node, project_id) VALUES (?,?,?,?)",
        (
            customprompt_id,
            json.dumps(data["flow"]),
            json.dumps(data["node"]),
            project_id,
        ),
    )
    db.commit()
    return customprompt_id


######################################################
######################################################
# Helper Functions
class IndexHelper:
    async def gen_from_image(id, filepath):
        """
        gen imgurl and info from image

        Args:
        prompt -- the prompt
        prompttype -- the type of prompt, e.g. description, image, or label
        Returns:
        imgurl(str)
        source(str)
        """
        imgurl = ""
        info = ""
        cropImage(filepath, 720)
        base64_image = encode_image(filepath)
        imgurl = genurl(id, local_path=filepath)
        info = await getdescription(imgurl)
        
        return imgurl, info

    def gen_from_description(
        prompt,
        expand=False,
    ):
        """
        gen img from description

        Args:
        prompt -- the prompt
        prompttype -- the type of prompt, e.g. description, image, or label
        Returns:
        imgurl(str)
        source(str)
        """
        info = prompt
        if expand == "true" or expand == True:
            info = genexpand(prompt)
        return info


    def gen_from_label(label: str):
        """
        gen img from label

        Args:
        prompt -- the prompt
        prompttype -- the type of prompt, e.g. description, image, or label
        Returns:
        imgurl(str)
        source(str)
        """
        label = label.upper()
        info = label.split(",")
        return info


    @staticmethod
    async def gen_canvas(id,info,filepath):
        imgurl = ""
        tempurl = await getcanvas(info)
        # logging.debug(f"Temp URL: {tempurl}")
        urllib.request.urlretrieve(tempurl, filepath)
        imgurl = genurl(id, local_path=filepath)
        return imgurl
    
    @staticmethod
    async def genio_from_description(
        prompt_id: int,
        project_id: int,
        env: str | list,
        syscolor: dict[str, any],
    ):
        """
        Generate input and output from description
        Args:
            prompt_id (int): The ID of the prompt.
            project_id (int): The ID of the project.
            env (str): Environment description.
            sysinfodict (dict): System information dictionary.
        """
        # print("Generating IO from description - " + env)
        # gen input
        logging.debug(f"env: {env}")
        input_sys = None
        input = None
        if isinstance(env, str):
            input,input_sys = await return_input(env, syscolor)
        elif isinstance(env, list):
            input = env

        logging.debug(f"Input: {input}")
        io = await return_addoutput(input, syscolor)
        logging.debug(f"IO: {io}")
        # io = return_io(input)
        if io is None:
            return None
        
        iosys = await return_system(io, syscolor,max_tries=3,known_nodesys=input_sys)
        logging.debug(f"IO System: {iosys}")
        if iosys is None:
            return None
        
        
        #add "UNKNOWN" to syscolor
        syscolor["UNKNOWN"] = ["rgb(136, 136, 136)", None]
        logging.debug(f"System Color: {syscolor}")
        iomatrix = nodematrix(io, iosys, syscolor)
        logging.debug(f"IO Matrix: {iomatrix}")
        # save io to db
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO prompt (id, flow, node, userinfo, project_id) VALUES (?,?,?,?,?)",
            (
                prompt_id,
                json.dumps(io),
                json.dumps(iomatrix),
                "Add more input -> output with AI",
                project_id,
            ),
        )
        db.commit()
        return prompt_id

@staticmethod
async def update(
    mode: str,
    prompt_id_array: list,
    query_array: list,
    syscolor: dict[str, any],
):
    """update db and return updated prompt_id

    Args:
        mode (_type_): _description_
        prompt_id : json array of prompt ids from the client
        query_array : json array of queries from the client
        currentmatrix : json array of current matrix from the client

    Returns:
        prompt_id_int : list of updated prompt ids
    """
    async with ClientSession() as session:
        # search in db for the prompt to get project_id
        project_id = get_prompt(prompt_id_array[0])["project_id"]
        combinedquery = []  # combine all queries
        new_prompt_id = get_max_prompt_id() + 1
        queryflow = []
        querymatrix = {}

        if mode in ["add-input", "add-output", "add-cooptimization", "add-feedback"]:
            for query in query_array:
                combinedquery = mergelist(combinedquery, query)
        elif mode == "add-process":
            for query in query_array:
                combinedquery = mergeflow(combinedquery, query)

        # solve feedback later
        if mode == "add-feedback":
            combinedquerystring = ", ".join(combinedquery)
            userinfo = f"Regeneration / Feedback for {combinedquerystring} added in each prompt frame as dashline.\n"
            userinfo+=f'<br>'
            for i in range(len(prompt_id_array)):
                prompt_id = prompt_id_array[i]
                prompt = get_prompt(prompt_id)
                
                updatedflow = []
                queryflow = await return_queryflow_add_feedback(
                    "add-feedback", query_array[i], prompt["flow"]
                )
                updatedflow=mergeflow(queryflow, prompt["flow"])
                for flow in queryflow:
                    flowstring = " --> ".join(flow)
                    userinfo+=f'<br>{flowstring}'
                
                db = get_db()
                cursor = db.cursor()
                #get feedbackflow from db
                cursor.execute(
                    "SELECT feedbackflow FROM prompt WHERE id = ?",
                    (prompt_id,),
                )
                result=cursor.fetchone()
                if result is None or result[0] is None:
                    feedbackflow = []
                else:
                    feedbackflow = json.loads(result[0])
                logging.debug(f"Previous Feedback Flow: {feedbackflow}")
                
                feedbackflow=mergeflow(queryflow, feedbackflow)
                logging.debug(f"Feedback Flow: {feedbackflow}")
                cursor.execute(
                    "UPDATE prompt SET flow = ?, feedbackflow = ? WHERE id = ?",
                    (
                        json.dumps(updatedflow),
                        json.dumps(feedbackflow),
                        prompt_id,
                    ),
                )
                db.commit()
        else:
            queryflow, querynodesys, userinfo = await return_queryflow_and_nodesys(
                mode, combinedquery, syscolor
            )
            querymatrix = return_matrix(mode, queryflow, querynodesys, syscolor)

        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO prompt (id, flow, node, userinfo, project_id) VALUES (?,?,?,?,?)",
            (
                new_prompt_id,
                json.dumps(queryflow),
                json.dumps(querymatrix),
                userinfo,
                project_id,
            ),
        )
        db.commit()
        return new_prompt_id
    
@staticmethod
async def update_img(id:int,filepath:str,info:str):
    imgurl = ""
    tempurl =await getcanvas(info)
    urllib.request.urlretrieve(tempurl, filepath)
    imgurl = genurl(id, local_path=filepath)
    # print("Image URL: ", imgurl)
    db= get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE project SET img_url = ? WHERE id = ?",
        (
            imgurl,
            id,
        ),
    )
    return imgurl,tempurl
    


######################################################
######################################################
def get_max_prompt_id():
    """Get the prompt id"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT MAX(id) FROM prompt")
    prompt_id = cursor.fetchone()[0]
    if prompt_id is None:
        prompt_id = 0
    return prompt_id


def get_max_project_id():
    """Get the project id"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT MAX(id) FROM project")
    project_id = cursor.fetchone()[0]
    if project_id is None:
        project_id = 0
    return project_id


def get_project(id, check_author=True):
    """Get project from db by id including all related prompt details aggregated"""
    project = (
        get_db()
        .execute(
            "SELECT p.id, p.author_id, p.created, p.title, p.type, p.info, p.img_url, p.system,"  # Added comma here
            'GROUP_CONCAT(pr.flow, ";") AS flow, '  # Ensure column names match your table definition
            'GROUP_CONCAT(pr.feedbackflow, ";") AS feedbackflow, '  # Ensure column names match your table definition
            'GROUP_CONCAT(pr.node, ";") AS node, '  # Same here
            'GROUP_CONCAT(pr.id, ";") AS prompt_id, '  # And here
            'GROUP_CONCAT(pr.userinfo, ";") AS userinfo '  # And here
            "FROM project p "
            "JOIN user u ON p.author_id = u.id "
            "LEFT JOIN prompt pr ON p.id = pr.project_id "
            "WHERE p.id = ? "
            "GROUP BY p.id",  # Necessary to aggregate prompt details
            (id,),
        )
        .fetchone()
    )


    if project is None or project["prompt_id"] is None:
        flash("Sorry! No information found for this project.")
        abort(404, f"Project id {id} doesn't exist.")

    if check_author and project["author_id"] != g.user["id"]:
        abort(403)

    return project


def get_customproject(id, check_author=True):
    """Get custom project from db by id including all related prompt details aggregated"""
    project = (
        get_db()
        .execute(
            """
                SELECT p.id, p.author_id, p.created, p.img_url, p.system, 
                pr.flow AS flow, 
                pr.node AS node, 
                pr.id AS prompt_id
                FROM project p
                JOIN user u ON p.author_id = u.id
                LEFT JOIN customprompt pr ON pr.id = (
                    SELECT MAX(pr2.id) 
                    FROM customprompt pr2
                    WHERE pr2.project_id = p.id
                )
                WHERE p.id = ?
                """,
            (id,),
        )
        .fetchone()
    )
    # print("Project: ", project)
    if project is None:
        abort(404, f"Project id {id} doesn't exist.")

    if check_author and project["author_id"] != g.user["id"]:
        abort(403)

    return project


def get_prompt(prompt_id: int, check_project: bool = False):
    """Get prompt from db by id
    if check_project is True, check if the prompt belongs to the project
    """
    if prompt_id is None:
        return None
    prompt = (
        get_db()
        .execute(
            "SELECT * FROM prompt WHERE id = ?",
            (prompt_id,),
        )
        .fetchone()
    )

    if prompt is None:
        abort(404, f"Generation error, please ask again.")

    # if check_project and prompt["project_id"] != g.project["id"]:
    #     abort(403)

    prompt_dict = {
        "id": prompt["id"],
        "flow": json.loads(prompt["flow"]),
        "node": json.loads(prompt["node"]),
        "userinfo": prompt["userinfo"],
        "project_id": prompt["project_id"],
    }
    return prompt_dict


def save_sysinfo_to_db(sysdict):
    """Save system to db"""
    db = get_db()
    # insert all syetem key,value pair
    for key, value in sysdict.items():
        db.execute("INSERT INTO system (sysname, color) VALUES (?, ?)", (key, value))
    db.commit()


if __name__ == "__main__":
    pass

# # (U) promptcanvas
# @socketio.on("save_promptcanvas")
# def save_promptcanvas(data):
#     print("Saved data to promptcanvas: ", data)
#     #save this image to instance/promptcanvas
#     data_url=data['data_url']
#     id=data['prompt_id']
#     image_data = base64.b64decode(data_url.split(',')[1])
#     image = Image.open(BytesIO(image_data))
#     filename = f'canvas_{id}.png'
#     image.save(os.path.join(current_app.instance_path, "promptcanvas", filename))
    

# def get_max_customprompt_id():
#     """Get the custom prompt id"""
#     db = get_db()
#     cursor = db.cursor()
#     cursor.execute("SELECT MAX(id) FROM customprompt")
#     prompt_id = cursor.fetchone()[0]
#     if prompt_id is None:
#         prompt_id = 0
#     return prompt_id

