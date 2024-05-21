import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";

const eventTypes = ['click', 'keydown', 'keyup', 'scroll', 'load'];

eventTypes.forEach(type => {
    // Determine the correct target for each event type
    const target = type === 'load' ? window : document;

    // Use the capture phase for all events to ensure they are intercepted early
    target.addEventListener(type, (event) => {
        // console.log(`Event type: ${type}`);
        // console.log('Event target:', event.target);
        CustomFlowline.fixLine();
    }, false); // Set useCapture to true to handle the event in the capturing phase
});

//fetch current offset 

//////////////////////////////customproject level function///////////////////////////////////////


const customprompt = document.getElementById('customprompt');
const computedStyle = window.getComputedStyle(customprompt);
const customPromptWrapper = document.querySelector('.customprompt-wrapper') as HTMLElement;


console.log(computedStyle.left, computedStyle.top, computedStyle.width, computedStyle.height);

function loadPlayground() {
    fetch('/save-to-custom')
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function parseJson(jsonString) {
    if (jsonString === 'None') { return []; }
    if (typeof jsonString === 'string') {
        var nodeObject = JSON.parse(jsonString);
    }
    else {
        var nodeObject = jsonString;
    }
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

function validId(nodeName) {

    // Replace problematic characters with dashes and remove leading/trailing non-alphanumeric characters
    return nodeName
        .replace(/[\s,().]+/g, '-') // Replace spaces, commas, and parentheses with dashes
        .replace(/--+/g, '-') // Replace multiple consecutive dashes with a single dash
        .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
        .replace(/[^\w-]+/g, ''); // Remove any remaining non-word characters (excluding dashes)
}

function processPrompt(nodeArray, flowArray) {
    function processCustomNode(node, systemArray) {
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
        //check if the node already exists
        let nodeItem=CustomNode.getNodebyInfo(nodeName, nodeX, nodeY, nodeSys, nodeTransform);
        if (nodeItem === undefined || nodeItem === null) {
            return new CustomNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, customPromptWrapper);
        }else{
            // console.log("Node already exists"+nodeItem.nodeContent);
            return nodeItem;
        }
    }

    var systemString = document.getElementById('customPromptSystem').innerHTML;
    var systemArray = parseJson(systemString);


    if (nodeArray.length != 0) {

        nodeArray.forEach((node) => processCustomNode(node, systemArray));
    }

    if (flowArray.length != 0) {
        flowArray.forEach((flow) => {
            for (var i = 1; i < flow.length - 1; i++) {
                let nodeStartArray = parseJson(flow[i])[0];
                let nodeEndArray = parseJson(flow[i + 1])[0];
                // console.log(nodeStartArray, nodeEndArray);
                var nodeStart = processCustomNode(nodeStartArray, systemArray)
                var nodeEnd = processCustomNode(nodeEndArray, systemArray)
                // nodeStart.setIdentifier('input-identifier');
                // nodeEnd.setIdentifier('output-identifier');
                // //check if there is a line between the two nodes
                // console.log(nodeStart.node, nodeEnd.node);
                if (CustomFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                    continue;
                }
                new CustomFlowline(nodeStart.node, nodeEnd.node);
            }
        });
    }

}

function setDOMeditable(editable:boolean) {
    let content = document.getElementById('custom-body-wrapper');
    if (editable) {
        //set the control in custom.html
        content.classList?.remove('readonly');
        content.classList?.add('editable');
    } else {
        //set the control in custom.html
        content.classList?.remove('editable');
        content.classList?.add('readonly');
    }
}

//Exectution

let flowString = customprompt.querySelector('#customPromptFlow').innerText;
let flowArray = parseJson(flowString);
let nodeString = customprompt.querySelector('#customPromptNode').innerText;
let nodeArray = parseJson(nodeString);
processPrompt(nodeArray, flowArray);


////////////////////////////////Process socket///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
var url = isLocal ? 'http://localhost:8000' : 'https://www.ecocircuitai.com';
var socket = io.connect(url);
socket.on('data_from_playground', function (data) {
    setDOMeditable(false);
    startload();
    var nodeArray = parseJson(data["node"]);
    var flowArray = parseJson(data["flow"]);
    // console.log(nodeArray, flowArray);
    processPrompt(nodeArray, flowArray);
    CustomFlowline.fixLine();
    // saveCustom();
    
    setDOMeditable(true);
    finishload();
});



// setInterval(saveCustom, 180000); //auto save every 3 minutes
// window.addEventListener('beforeunload', function (event) {
//     saveCustom();  // Call the save function
//     event.preventDefault(); // Prevent the default action
//     //event.returnValue = 'Are you sure you want to leave?';
// });




/////////////////////////customprompt functions///////////////////////////////
function saveCustom() {
    let prompt_id = document.getElementById('custom-id').innerHTML; //prompt_id === project_id
    let { flow, nodematrix } = returnInfo();
    console.log(flow, nodematrix)
    var image;
    var canvas;
    socket.emit('save_custom', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix });
}


function returnInfo() {
    let flow = [];
    let nodematrix = {};
    CustomFlowline.myCustomLines.forEach((line) => {
        flow.push(line.toJSONArray());
    })
    CustomNode.myCustomNodes.forEach((node) => {
        nodematrix = { ...nodematrix, ...node.toJSONObj() };
    })
    return { flow, nodematrix };
}


