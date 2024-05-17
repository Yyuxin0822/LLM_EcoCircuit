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
from flask_socketio import SocketIO, send, emit
from . import socketio


bp = Blueprint("project", __name__)

@bp.before_request
def set_test_user():
    if current_app.config["TESTING"]:
        g.user = {"id": 1, "username": "testuser"}


#################generate.html################
##############################################
# (C)index  - prompting the user three ways of entering data
@bp.route("/", methods=("GET", "POST"))
@login_required
def index():
    if request.method == "POST":

        filepath = os.path.join(current_app.instance_path, "images/envir.jpg")
        max_project_id = get_max_project_id()
        max_prompt_id = get_max_prompt_id()

        # save_sysinfo_to_db(defaultsysdict)

        requesttype = request.form["requesttype"]
        system= request.form["system"]

        if requesttype == "description":
            prompt = request.form["description"]
            expand = request.form["expand"]
            imgurl, info = IndexHelper.gen_from_description(
                (max_project_id + 1), prompt, filepath, expand
            )
        elif requesttype == "label":
            prompt = request.form["label"]
            # print the type of prompt
            imgurl, info = IndexHelper.gen_from_label(
                (max_project_id + 1), prompt, filepath
            )
        elif requesttype == "image":
            if request.files:
                file = request.files["image"]
                if file.filename == "":
                    return "No selected file"
                if file:
                    # filename = secure_filename(file.filename)
                    file.save(filepath)
                    prompt = "Untitled"
                    imgurl, info = IndexHelper.gen_from_image(
                        (max_project_id + 1), filepath
                    )
                    # print(info)
        IndexHelper.genio_from_description(
            (max_prompt_id + 1), (max_project_id + 1), info, json.loads(system)
        )
        logging.debug(max_prompt_id + 1)
        error = None

        if imgurl is None or info is None:
            error = "Generation error, please try again."
            flash(error)
            return render_template("project/index.html"), 400
        else:
            if isinstance(info, list):
                info = ", ".join(info)  # info as list is used for label

            db = get_db()
            cursor = db.cursor()
            cursor.execute(
                "INSERT INTO project (author_id, title, type, info, img_url, system) \
                VALUES (?, ?, ?, ?, ?, ?)",
                (g.user["id"], prompt, 
                 requesttype, info, imgurl,
                 system),
            )
            db.commit()
            project_id = cursor.lastrowid  # This gets the last inserted ID
            # print("Project ID: ", project_id)
            return redirect(url_for("project.generate", id=project_id))

    return render_template("project/index.html")


# (R)
@bp.route("/<int:id>", methods=("GET", "POST"))
@login_required
def generate(id):
    project = get_project(id)
    return render_template("project/generate.html", project=project, id=id)


# (U)
@bp.route("/addio", methods=["POST"])
@login_required
def addio():
    data = request.get_json()
    print("type of data: ", (data["sysdict"]))
    print("type of data: ", type(json.loads(data["sysdict"])))
    
    prompt_id = get_max_prompt_id() + 1
    prompt_id = IndexHelper.genio_from_description(
        prompt_id, data["project_id"], data["info"], json.loads(data["sysdict"])
    )
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

    prompt_id = update(mode, prompt_id_list, info_list, json.loads(data["sysdict"]))
    if prompt_id is None:
        error = "Gereration error, please ask again."
        flash(error)
        return 400
    else:
        return jsonify({"status": "success"})


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
            node = ?
        WHERE id = ?
        """,
        (
            json.dumps(data["flow"]),  # Serialize the flow data to a JSON string
            json.dumps(data["node"]),  # Serialize the node data to a JSON string
            data["prompt_id"],  # The ID for the record to update
        ),
    )

    db.commit()
    return data["prompt_id"]

# (UD)
@socketio.on("save_system")
def save_system_to_project(data):
    print("Saved data to project: ", data)
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
    print('Received data:', data)

    project_id = int(data["project_id"])
    flow_array = data["flow_array"]
    node_array = data["node_array"]

    #pass the nodes and flows to the custom
    emit("data_from_playground", {'project_id':project_id,"flow": flow_array, "node": node_array}, broadcast=True)
    #code to make sure that the data is saved when received in the custom


@bp.route("/delete/<int:id>", methods=("POST",))
@login_required
def delete(id):
    get_project(id)
    db = get_db()
    db.execute("DELETE FROM post WHERE id = ?", (id,))
    db.commit()
    return redirect(url_for("project.index"))


######################################################
######################################################
# Helper Functions
class IndexHelper:
    def gen_from_description(
        id,
        prompt,
        filepath,
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
        imgurl = ""
        if expand == "true" or expand == True:
            info = genexpand(prompt)
        tempurl = getcanvas(info)
        # logging.debug(f"Temp URL: {tempurl}")
        urllib.request.urlretrieve(tempurl, filepath)
        imgurl = genurl(id, local_path=filepath)
        return imgurl, info

    def genio_from_description(
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
        if isinstance(env, str):
            input = return_input(env, syscolor)
        elif isinstance(env, list):
            input = env

        io = return_addoutput(input, syscolor)
        # io = return_io(input)
        if io is None:
            return None
        
        iosys = return_system(io, syscolor)
        logging.debug(f"IO System: {iosys}")
        if iosys is None:
            return None

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

    def gen_from_image(id, filepath):
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
        info = getdescription(base64_image)
        imgurl = genurl(id, local_path=filepath)
        return imgurl, info

    def gen_from_label(id, label: str, filepath):
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
        imgurl = ""
        tempurl = getcanvas(f"envision a place with {label}")
        urllib.request.urlretrieve(tempurl, filepath)
        imgurl = genurl(id, local_path=filepath)
        return imgurl, info


def update(
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
            queryflow = return_queryflow_add_feedback(
                "add-feedback", query_array[i], prompt["flow"]
            )
            updatedflow=mergeflow(queryflow, prompt["flow"])
            for flow in queryflow:
                flowstring = " --> ".join(flow)
                userinfo+=f'<br>{flowstring}'
            
        
            db = get_db()
            cursor = db.cursor()
            cursor.execute(
                "UPDATE prompt SET flow = ? WHERE id = ?",
                (
                    json.dumps(updatedflow),
                    prompt_id,
                ),
            )
            db.commit()
    else:
        queryflow, querynodesys, userinfo = return_queryflow_and_nodesys(
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


@socketio.on("save_custom")
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
def get_max_prompt_id():
    """Get the prompt id"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT MAX(id) FROM prompt")
    prompt_id = cursor.fetchone()[0]
    if prompt_id is None:
        prompt_id = 0
    return prompt_id


def get_max_customprompt_id():
    """Get the custom prompt id"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT MAX(id) FROM customprompt")
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

    if project is None:
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
    print("Project: ", project)
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


# def get_customprompt(prompt_id: int, check_project: bool = False):
#     """Get prompt from db by id
#     if check_project is True, check if the prompt belongs to the project
#     """
#     prompt = (
#         get_db()
#         .execute(
#             "SELECT * FROM customprompt WHERE id = ?",
#             (prompt_id,),
#         )
#         .fetchone()
#     )

#     if prompt is None:
#         # abort(404, f"Generation error, please ask again.")
#         return None

#     # if check_project and prompt["project_id"] != g.project["id"]:
#     #     abort(403)

#     prompt_dict = {
#         "id": prompt["id"],
#         "flow": json.loads(prompt["flow"]),
#         "node": json.loads(prompt["node"]),
#         "system": json.loads(prompt["system"]),
#         "project_id": prompt["project_id"],
#     }
#     return prompt_dict


def save_sysinfo_to_db(sysdict):
    """Save system to db"""
    db = get_db()
    # insert all syetem key,value pair
    for key, value in sysdict.items():
        db.execute("INSERT INTO system (sysname, color) VALUES (?, ?)", (key, value))
    db.commit()


if __name__ == "__main__":
    pass
