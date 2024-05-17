import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";


document.addEventListener('click', (e) => {
    // Prevent the message from being sent if the click happens inside an element within the iframe
    if (e.target !== document.documentElement) {
        console.log("triggered")
        window.parent.postMessage('clickinside', '*');
    }
});

window.addEventListener('message', (event) => {
    if (event.data === 'clickOutside') {
        // Handle the event, e.g., trigger a specific function
        handleOutsideClick();
    }
});

function handleOutsideClick() {
    // Define what should happen when the click outside event is detected
    console.log('Clicked outside the iframe');
    // Add your specific event handling code here
}


//fetch current offset 

//////////////////////////////////////////////////////////////////////////////////////


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
    if (nodeArray.length != 0) {
        nodeArray.forEach((node, nIndex) => {
            var nodeName = node[0];
            var nodeX = node[1][0];
            var nodeY = node[1][1];
            var nodeSystem = node[2];
            var nodeTransform = "translate(0,0)";
            if (node[3]) { nodeTransform = node[3]; }
            
            var systemString = document.getElementById('customPromptSystem').innerHTML;
            var systemArray = parseJson(systemString);
            
            let defaultRGB = systemArray.find((system) => { system[0] === "UNKNOWN" });
            let nodeRGB = defaultRGB ? hexToRGBA(defaultRGB[1], 0.75) : hexToRGBA("#888", 0.75);
            let nodeSys = "UNKNOWN";
    
            systemArray.forEach((system) => {
                if (system[0] === nodeSystem) {
                    nodeSys = system[0];
                    nodeRGB = hexToRGBA(system[1], 0.75);
                }
            });
            new CustomNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, customPromptWrapper);
        });
    }

    if (flowArray.length != 0) {
        flowArray.forEach((flow) => {
            for (var i = 1; i < flow.length - 1; i++) {
                var nodeStart = CustomNode.getNodeById('node' + validId(flow[i]));
                var nodeEnd = CustomNode.getNodeById('node' + validId(flow[i + 1]));
                nodeStart.setIdentifier('input-identifier');
                nodeEnd.setIdentifier('output-identifier');
                //check if there is a line between the two nodes
                if (CustomFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                    continue;
                }
                new CustomFlowline(nodeStart.node, nodeEnd.node);
            }
        });
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
    var nodeArray = parseJson(data["node"]);
    var flowArray = parseJson(data["flow"]);
    console.log(nodeArray, flowArray);
    processPrompt(nodeArray, flowArray);
    saveCustom();
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
        nodematrix ={...nodematrix, ...node.toJSONObj()};
    })
    return { flow, nodematrix };
}


// function absPostionMatrix(prompt) {
//     //this function is to transform the relative position matrix to absolute position matrix
//     //the relative position matrix is the matrix that is stored in the database
//     //the absolute position matrix is the matrix that is displayed in the playground

//     //the absolute position matrix is a 2D array with the following structure
//     // {nodeName:[[absX, absY], nodeSystem]}

//     let absMatrix = {};

//     var nodewrapper = prompt.querySelectorAll('.node-wrapper')
//     nodewrapper.forEach((nodewrapper) => {
//         let node = nodewrapper.closest('.node');
//         let absPosition = [parseFloat(node.style.left), parseFloat(node.style.top)]
//         absMatrix[nodewrapper.innerHTML] = [absPosition, node.style.transform, node.style.backgroundColor];
//     })
//     return absMatrix;
// }

