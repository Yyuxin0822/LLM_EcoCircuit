//@ts-ignore
import { PlaygroundFuncBar } from './PlaygroundFuncBar.js';
//@ts-ignore
import { Prompt } from './prompt/Prompt.js';
//@ts-ignore
import { PromptFlowline } from './prompt/PromptFlowline.js';
//@ts-ignore
import { PromptNode } from './prompt/PromptNode.js';
//@ts-ignore
import {DefaultSystem, System, SystemFuncBar} from '../SystemBar.js';


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

///////////////////////////Main Flow Control ///////////////
////////////////////////////////////////////////////////////

window.onload = function () {
    PromptFlowline.fixLine();
    var lastPrompt = Prompt.allPrompts[Prompt.allPrompts.length - 1].prompt;
    var previousElement = lastPrompt.previousElementSibling;

    if (previousElement && !previousElement.classList.contains('hidden')) {
        previousElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(finishload, 500);// Estimate the scroll duration (e.g., 500 milliseconds)
    }
    finishload();
}


////////////// function-frame ////////////// 
const playFuncBar = new PlaygroundFuncBar(document.querySelector('.function-frame'));

// toggling views //temporarily deactivated 
// function toggleViews() {
//     document.getElementById('view-playground')?.classList.toggle('hidden');
//     document.getElementById('view-custom')?.classList.toggle('hidden');
//     contentFrame.classList.toggle('hidden');
//     contentCustom.classList.toggle('hidden');
// }

// document.getElementById('toggle-playground')?.addEventListener('click', toggleViews);
// document.getElementById('toggle-custom')?.addEventListener('click', toggleViews);

// toggling fold/unfold engineer bar
function toggleEngineerBar() {
    document.getElementById('engineer-bar-unfolded')?.classList.toggle('hidden');
    document.getElementById('engineer-bar-folded')?.classList.toggle('hidden');
}

document.getElementById('fold')?.addEventListener('click', toggleEngineerBar);
document.getElementById('unfold')?.addEventListener('click', toggleEngineerBar);

//toggle quickselect //temporarily deactivated
// const quicksel = document.getElementById('quicksel-folded')
// const unquickseltab = document.getElementById('quicksel-unfolded')
// const unqickselbutton = document.getElementById('quicksel-unfolded-button')
// unqickselbutton?.addEventListener('click', (e) => {
//     quicksel?.classList.remove('hidden');
//     unquickseltab?.classList.add('hidden');
//     nodesel = false;
//     linesel = false;
//     rmIdentifier();
// });

// quicksel?.addEventListener('click', (e) => {
//     quicksel?.classList.add('hidden');
//     unquickseltab?.classList.remove('hidden');
//     var engtabs = document.querySelectorAll('.component-eng-tab');
//     engtabs.forEach(t => {
//         t.classList?.add('eng-unselected');
//         t.classList?.remove('eng-selected');
//     });
//     nodesel = true;
//     linesel = true;
//     addIdentifier();
// });

// playtab toggle
// const addinputtab = document.getElementById('add-input');
// const addoutputtab = document.getElementById('add-output');
// const addprocesstab = document.getElementById('add-process');
// const addcooptimizationtab = document.getElementById('add-cooptimization');
// const addfeedbacktab = document.getElementById('add-feedback');

////////////// info-frame ////////////// 
const systemBar = new SystemFuncBar(document.getElementById('system-bar'));
var systemString = systemBar.container.querySelector('#project-system').innerText;
console.log(systemString);
var systemArray = parseJson(systemString);
console.log(systemArray);

function processSystem(container: HTMLElement) {
    systemArray.forEach((system) => {
        let systemIcon = new System(container, system[0], system[1],system[2]);
        DefaultSystem.currentSystems.push({
            "content": system[0],
            "color": system[1],
            "iconUrl": system[2]
        });
    });
}

processSystem(systemBar.container);

// function confirmColor(){
//     systemArray=System.returnSysArray();
//     systemBar.container.querySelector('#project-system').innerText = JSON.stringify(systemArray);
//     window.location.reload();
// }
// function resetColor(){}


////////////// prompt-frame ////////////// 
let findFeedback = (parentPrompt: HTMLElement) => {
    var userPrompt = parentPrompt.previousElementSibling;
    var userInfoElement = userPrompt.querySelector('.userinfo');
    if (userInfoElement) {

        var feedbackInfo = userInfoElement.innerHTML.trim();
        //trim whitespace and find the first word
        var feedbackType = feedbackInfo.split(' ')[0];
        if (feedbackType != 'Feedback' && feedbackType != 'Regeneration') {
            return;
        }

        // Regex to find patterns like 'Element1--&gt; Element2' considering HTML entity
        var regex = /\s*(.*?)\s*--&gt;\s*(.*?)\s*(?=<br>|$)/g;
        var matches, pairs = [];

        // Extracting pairs using the regex
        while (matches = regex.exec(feedbackInfo)) {
            // matches[1] and matches[2] are the captured groups from the regex
            pairs.push([matches[1], matches[2]]);
        }
        return pairs;

    }
}

function processPrompt(prompt) {
    var prIndex = prompt.id.replace('prompt', '');
    // console.log(prIndex);
    var flowString = prompt.querySelector('#promptFlow' + prIndex).innerText;
    var flowArray = parseJson(flowString);
    var nodeString = prompt.querySelector('#promptNode' + prIndex).innerText;
    var nodeArray = parseJson(nodeString);

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
        col.style.left = coorXMap[x] + 'rem';
        parentPrompt.appendChild(col);
    });

    nodeArray.forEach((node, nIndex) => {
        var nodeName = node[0];
        var nodeX = node[1][0];
        var nodeY = node[1][1];
        var nodeSystem = node[2];
        var nodeTransform = "translate(0,0)";
        if (node[3]) { nodeTransform = node[3]; }
        let defaultRGB = systemArray.find((system) => { system[0] === "UNKNOWN" });
        let nodeRGB = defaultRGB ? hexToRGBA(defaultRGB[1], 0.75) : hexToRGBA("#888", 0.75);
        let nodeSys = "UNKNOWN";

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
            // console.log(flow[i]);
            // console.log(flow[i + 1]);
            var nodeStart = PromptNode.getNodeById('node' + validId(flow[i]), parentPrompt);
            var nodeEnd = PromptNode.getNodeById('node' + validId(flow[i + 1]), parentPrompt);
   
            if (nodeStart == null || nodeEnd == null || nodeStart.node == nodeEnd.node) {
                return;
            }
            if (PromptFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                continue;
            }
            var line = new PromptFlowline(nodeStart.node, nodeEnd.node);
        }
    });


    if (nodeArray.length == 0) {
        parentPrompt.style.display = 'none';
        let feedbackLines = findFeedback(parentPrompt);

        if (feedbackLines) {
            feedbackLines.forEach((line) => {
                PromptFlowline.getAllLines().forEach((flowline) => {
                    if (flowline.start.querySelector('.node-wrapper').innerText == line[0] && flowline.end.querySelector('.node-wrapper').innerText == line[1]) {
                        flowline.feedback = true;
                        flowline.setFeedbackStyle();

                    }
                })
            })
        }
        return;
    }
}

var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);

// AJAX prompt
const addiotab = document.getElementById('add-io');
addiotab?.addEventListener('click', addio);
function addio() {
    startload();
    let id = document.getElementById('project_id').innerHTML;
    let info = document.getElementById('info').innerHTML;
    let sysdict = DefaultSystem.returnPrjDict();
    fetch('/addio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'project_id': id, 'info': info, 'sysdict': JSON.stringify(sysdict) })
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
        // .catch(error => {
        //     console.error('Error:', error);
        //     alert('Sorry! Failed to process your request. Please try again.');
        //     // Optionally, re-enable the form or button for resubmission
        //     finishload();
        // })
        .finally(() => {
            // finishload();
            console.log('finish load');
        });
}

let quickgen = document.getElementById('quickgen');
quickgen?.addEventListener('click', () => {
    let mode = playFuncBar.returnMode();
    if (!mode) {
        alert('Please select a generation mode in controller and some contents to prompt')
        return;
    }
    let { prompt_id_array, query_array } = Prompt.returnAllQuery();

    // console.log(prompt_id_array, query_array);
    if (prompt_id_array.length == 0) {
        alert('Please select at least one node or one flow prompt');
        return;
    }

    let sysdict = DefaultSystem.returnPrjDict();

    startload();

    fetch('/quickgen', {
        method: 'POST',
        body: JSON.stringify({
            'mode': mode,
            'prompt_id_array': prompt_id_array,
            'info_array': query_array,
            'sysdict': JSON.stringify(sysdict)
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
        // .catch(error => {
        //     console.error('Error:', error);
        //     alert('Sorry! Failed to process your request. Please try again.');
        //     finishload();
        //     // Optionally, re-enable the form or button for resubmission
        // })
        .finally(() => {
            // finishload();
            console.log('finish load');
        });
});


// function returnInfo(absposition = false) {
//     let info = [];
//     let prompt_id = [];
//     let currentmatrix = [];
//     let prompts = document.querySelectorAll('.prompt');
//     prompts.forEach(prompt => {
//         absPostionMatrix(prompt);
//         let promptinfo = [];
//         if (PromptNode.nodeSel) {
//             var selectednodes = prompt.querySelectorAll('.node-selected');
//             selectednodes.forEach(node => {
//                 promptinfo.push(node.querySelector(".node-wrapper").innerHTML);
//             });
//         }

//         if (PromptFlowline.lineSel) {
//             savedMatchedLines.forEach(line => {
//                 let tempNode = [];
//                 tempNode.push(line.start.querySelector(".node-wrapper").innerHTML);
//                 tempNode.push(line.end.querySelector(".node-wrapper").innerHTML);

//                 //test if the first node of tempnode is a child of prompt
//                 if (line.start.closest(".prompt") == prompt) {
//                     promptinfo.push(tempNode);
//                 }
//             })
//         }

//         if (promptinfo.length > 0) {
//             info.push(promptinfo);
//             prompt_id.push(prompt.id);
//             if (!absposition) {
//                 currentmatrix.push(prompt.querySelector(prompt.id.replace('prompt', '#promptNode')).innerText);
//             }
//             else {
//                 currentmatrix.push(absPostionMatrix(prompt));
//             }
//         } else { return; }

//     })

//     return { prompt_id, info, currentmatrix };
// }

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

function getnodePositionInDOM(node: HTMLElement) {
    let x = 0;
    let y = 0;
    let nodeparent = node.closest('.prompt-frame');
    while (node) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement;
        if (node === nodeparent) {
            break;
        }
    }
    return [x, y];
}


document.querySelector('.prompt-user').classList.add('hidden');


///////////////////////////socket function/////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
// // Determine if the app is running locally or on a production server
// var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// var url = isLocal ? 'http://localhost:5000' : 'https://www.ecocircuitai.com';

// // Initialize the Socket.IO client
// var socket = io(url, { path: '/socket.io' });
// function sendDataToCustom() {
//     let { prompt_id, info, currentmatrix } = returnInfo(true);
//     let id = document.getElementById('project_id').innerHTML;
//     socket.emit('send_data_to_custom', {
//         'project_id': id,
//         'prompt_id_array': prompt_id,
//         'info_array': info,
//         'currentmatrix_array': currentmatrix
//     });
// }

// function savePlayground() {
//     let project_id = document.getElementById('project_id').innerHTML;
//     let { prompt_id, flow, nodematrix } = Prompt.returnAllInfo();
//     socket.emit('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix, "project_id": project_id });
// }


