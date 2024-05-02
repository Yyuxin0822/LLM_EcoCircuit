import { PlaygroundFuncBar } from './PlaygroundFuncBar.js';
import { Prompt } from '../generateplayground/Prompt.js';
import { PromptFlowline } from '../generateplayground/PromptFlowline.js';
import { PromptNode } from '../generateplayground/PromptNode.js';

///////////////Helper Func////////////////////
const eventTypes = ['click', 'keydown', 'keyup', 'scroll', 'load'];

eventTypes.forEach(type => {
    // Determine the correct target for each event type
    const target = type === 'load' ? window : document;

    // Use the capture phase for all events to ensure they are intercepted early
    target.addEventListener(type, (event) => {
        // console.log(`Event type: ${type}`);
        // console.log('Event target:', event.target);
        PromptFlowline.fixLine(); 
    }, false); // Set useCapture to true to handle the event in the capturing phase
});

function parseJson(jsonString) {
    var nodeObject = JSON.parse(jsonString);
    var node = [];
    Object.entries(nodeObject).forEach(([key, value]) => {
        var subnode = [];
        subnode.push(key);
        if (Array.isArray(value)) {
            value.forEach(item => subnode.push(item));
        } else {
            subnode.push(value);
        }
        node.push(subnode);
    });
    return node;
}


function processPrompt(prompt) {
    var prIndex = prompt.id.replace('prompt', '');
    console.log(prIndex);
    var flowString = prompt.querySelector('#promptFlow' + prIndex).innerText;
    var flowArray = parseJson(flowString);
    var nodeString = prompt.querySelector('#promptNode' + prIndex).innerText;
    var nodeArray = parseJson(nodeString);
    var systemString = prompt.querySelector('#promptSystem' + prIndex).innerText;
    var systemArray = parseJson(systemString);

    var promptObject = new Prompt(prIndex);
    var parentPrompt = promptObject.prompt;
    
    let NodeX = Array.from(new Set(nodeArray.map(node => node[1][0])));
    let coorXMap = Prompt.processNodeX(NodeX.sort());
    let NodeY = Array.from(new Set(nodeArray.map(node => node[1][1])));
    let NodeYMax = Math.max(...NodeY);
    parentPrompt.style.height = ((NodeYMax + 1) * 1.5 + 6) + 'rem';
    NodeX.forEach((x) => {
        let col = document.createElement("div");
        col.classList.add('col');
        col.id = 'col' + validId(x.toString());
        col.style.left = coorXMap[x]+'rem';
        parentPrompt.appendChild(col);
    });

    nodeArray.forEach((node, nIndex) => {
        var nodeName = node[0];
        var nodeId = validId(nodeName);
        var nodeX = node[1][0];
        var nodeY = node[1][1];
        var nodeSystem = node[2];
        var nodeTransform = "translate(0,0)";
        let defaultRGB=systemArray.find((system) => {system[0] === "UNKNOWN"}); 
        let nodeRGB=defaultRGB?hexToRGBA(defaultRGB[1], 0.75):hexToRGBA("#888", 0.75);
        let nodeSys="UNKNOWN";

        systemArray.forEach((system) => {
            if (system[0] === nodeSystem) {
               nodeSys = system[0];
               nodeRGB = hexToRGBA(system[1], 0.75);
            }
        });
        var promptNode = new PromptNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, parentPrompt);
    });

    flowArray.forEach((flow) => {
        // console.log(flow);
        for (var i = 1; i < flow.length - 1; i++) {
            var nodeStart = PromptNode.getNodeById('node' + validId(flow[i]), parentPrompt);
            var nodeEnd = PromptNode.getNodeById('node' + validId(flow[i + 1]), parentPrompt);
            if (PromptFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                continue;
            }
            var line = new PromptFlowline(nodeStart.node, nodeEnd.node);
        }
    });
}


////////////// function-frame ////////////// 
// toggling views 
function toggleViews() {
    document.getElementById('view-playground')?.classList.toggle('hidden');
    document.getElementById('view-custom')?.classList.toggle('hidden');
    contentFrame.classList.toggle('hidden');
    contentCustom.classList.toggle('hidden');
}

document.getElementById('toggle-playground')?.addEventListener('click', toggleViews);
document.getElementById('toggle-custom')?.addEventListener('click', toggleViews);

// toggling fold/unfold engineer bar
function toggleEngineerBar() {
    document.getElementById('engineer-bar-unfolded')?.classList.toggle('hidden');
    document.getElementById('engineer-bar-folded')?.classList.toggle('hidden');
}

document.getElementById('fold')?.addEventListener('click', toggleEngineerBar);
document.getElementById('unfold')?.addEventListener('click', toggleEngineerBar);

//toggle quickselect
const quicksel = document.getElementById('quicksel-folded')
const unquickseltab = document.getElementById('quicksel-unfolded')
const unqickselbutton = document.getElementById('quicksel-unfolded-button')
unqickselbutton?.addEventListener('click', (e) => {
    quicksel?.classList.remove('hidden');
    unquickseltab?.classList.add('hidden');
    nodesel = false;
    linesel = false;
    rmIdentifier();
});

quicksel?.addEventListener('click', (e) => {
    quicksel?.classList.add('hidden');
    unquickseltab?.classList.remove('hidden');
    var engtabs = document.querySelectorAll('.component-eng-tab');
    engtabs.forEach(t => {
        t.classList?.add('eng-unselected');
        t.classList?.remove('eng-selected');
    });
    nodesel = true;
    linesel = true;
    addIdentifier();
});

// playtab toggle
// const addinputtab = document.getElementById('add-input');
// const addoutputtab = document.getElementById('add-output');
// const addprocesstab = document.getElementById('add-process');
// const addcooptimizationtab = document.getElementById('add-cooptimization');
// const addfeedbacktab = document.getElementById('add-feedback');
const addiotab = document.getElementById('add-io');
const playFuncBar= new PlaygroundFuncBar(document.querySelector('.function-frame'));


////////////// prompt-frame ////////////// 
var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);

// AJAX prompt
addiotab?.addEventListener('click', addio);
function addio() {
    startload();
    let id = document.getElementById('project_id').innerHTML;
    let info = document.getElementById('info').innerHTML;
    fetch('/addio', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'project_id': id, 'info': info }),
    })
        .then(response => response.json())
        .then(data => {
            // let prompt_id = loadajax(data['prompt']);
            // let prompt = document.getElementById('prompt' + prompt_id);
            // processPrompt(prompt);
            // scroll to the bottom
            window.location.reload();
            // document.getElementById('prompt-frame').scrollIntoView(false);
            console.log('load success')
        })
        .finally(() => {
            // finishload();
        });
}

let quickgen = document.getElementById('quickgen');
quickgen?.addEventListener('click', () => {

    let mode = playFuncBar.returnMode();
    if (!mode) return;

    startload();
    let { prompt_id, info, currentmatrix } = returnInfo();

    fetch('/quickgen', {
        method: 'POST',
        body: JSON.stringify({
            'mode': mode,
            'prompt_id_array': prompt_id,
            'info_array': info,
            'currentmatrix_array': currentmatrix, //please do return current matrix as I wanted to utilize scripts to record transform
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            window.location.reload();
            console.log('load success')
        })
        .finally(() => {

            finishload();
        });
});



// quickgen sending data





function returnInfo(absposition = false) {
    let info = [];
    let prompt_id = [];
    let currentmatrix = [];
    let prompts = document.querySelectorAll('.prompt');
    prompts.forEach(prompt => {
        absPostionMatrix(prompt);
        let promptinfo = [];
        if (PromptNode.nodeSel) {
            var selectednodes = prompt.querySelectorAll('.node-selected');
            selectednodes.forEach(node => {
                promptinfo.push(node.querySelector(".node-wrapper").innerHTML);
            });
        }

        if (PromptFlowline.lineSel) {
            savedMatchedLines.forEach(line => {
                let tempNode = [];
                tempNode.push(line.start.querySelector(".node-wrapper").innerHTML);
                tempNode.push(line.end.querySelector(".node-wrapper").innerHTML);

                //test if the first node of tempnode is a child of prompt
                if (line.start.closest(".prompt") == prompt) {
                    promptinfo.push(tempNode);
                }
            })
        }

        if (promptinfo.length > 0) {
            info.push(promptinfo);
            prompt_id.push(prompt.id);
            if (!absposition) {
                currentmatrix.push(prompt.querySelector(prompt.id.replace('prompt', '#promptNode')).innerText);
            }
            else {
                currentmatrix.push(absPostionMatrix(prompt));
            }
        } else { return; }

    })

    return { prompt_id, info, currentmatrix };
}

function absPostionMatrix(prompt) {
    //this function is to transform the relative position matrix to absolute position matrix
    //the relative position matrix is the matrix that is stored in the database
    //the absolute position matrix is the matrix that is displayed in the playground

    //the absolute position matrix is a 2D array with the following structure
    // {nodeName:[[absX, absY], nodeSystem]}

    let absMatrix = {};

    var nodewrapper = prompt.querySelectorAll('.node-wrapper')
    nodewrapper.forEach((nodewrapper) => {
        let node = nodewrapper.closest('.node');
        let absPosition = getnodePositionInDOM(node);
        absMatrix[nodewrapper.innerHTML] = [absPosition, node.style.transform, node.style.backgroundColor];
    })
    return absMatrix;
}

function getnodePositionInDOM(node) {
    let x = 0;
    let y = 0;
    nodeparent = node.closest('.prompt-frame');
    while (node) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
        if (node === nodeparent) {
            break;
        }
    }
    return [x, y];
}


document.querySelector('.prompt-user').classList.add('hidden');


///////////////////////////socket function/////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
var socket = io.connect('http://localhost:5000');
function sendDataToCustom() {
    let { prompt_id, info, currentmatrix } = returnInfo(true);
    let id = document.getElementById('project_id').innerHTML;
    socket.emit('send_data_to_custom', {
        'project_id': id,
        'prompt_id_array': prompt_id,
        'info_array': info,
        'currentmatrix_array': currentmatrix
    });
}

// function savePlayground() {
//     let project_id = document.getElementById('project_id').innerHTML;
//     let { prompt_id, flow, nodematrix } = Prompt.returnAllInfo();
//     socket.emit('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix, "project_id": project_id });
// }

