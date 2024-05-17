import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";
document.addEventListener('click', (e) => {
    if (e.target !== document.documentElement) {
        console.log("triggered");
        window.parent.postMessage('clickinside', '*');
    }
});
window.addEventListener('message', (event) => {
    if (event.data === 'clickOutside') {
        handleOutsideClick();
    }
});
function handleOutsideClick() {
    console.log('Clicked outside the iframe');
}
const customprompt = document.getElementById('customprompt');
const computedStyle = window.getComputedStyle(customprompt);
const customPromptWrapper = document.querySelector('.customprompt-wrapper');
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
    if (jsonString === 'None') {
        return [];
    }
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
        }
        else {
            subnode.push(value);
        }
        node.push(subnode);
    });
    return node;
}
function validId(nodeName) {
    return nodeName
        .replace(/[\s,().]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/[^\w-]+/g, '');
}
function processPrompt(nodeArray, flowArray) {
    if (nodeArray.length != 0) {
        nodeArray.forEach((node, nIndex) => {
            var nodeName = node[0];
            var nodeX = node[1][0];
            var nodeY = node[1][1];
            var nodeSystem = node[2];
            var nodeTransform = "translate(0,0)";
            if (node[3]) {
                nodeTransform = node[3];
            }
            var systemString = document.getElementById('customPromptSystem').innerHTML;
            var systemArray = parseJson(systemString);
            let defaultRGB = systemArray.find((system) => { system[0] === "UNKNOWN"; });
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
                if (CustomFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                    continue;
                }
                new CustomFlowline(nodeStart.node, nodeEnd.node);
            }
        });
    }
}
let flowString = customprompt.querySelector('#customPromptFlow').innerText;
let flowArray = parseJson(flowString);
let nodeString = customprompt.querySelector('#customPromptNode').innerText;
let nodeArray = parseJson(nodeString);
processPrompt(nodeArray, flowArray);
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
function saveCustom() {
    let prompt_id = document.getElementById('custom-id').innerHTML;
    let { flow, nodematrix } = returnInfo();
    console.log(flow, nodematrix);
    var image;
    var canvas;
    socket.emit('save_custom', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix });
}
function returnInfo() {
    let flow = [];
    let nodematrix = {};
    CustomFlowline.myCustomLines.forEach((line) => {
        flow.push(line.toJSONArray());
    });
    CustomNode.myCustomNodes.forEach((node) => {
        nodematrix = { ...nodematrix, ...node.toJSONObj() };
    });
    return { flow, nodematrix };
}
