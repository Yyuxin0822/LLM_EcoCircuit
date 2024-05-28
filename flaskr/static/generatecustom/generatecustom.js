import { CustomNode } from "./CustomNode.js";
import { CustomFlowline } from "./CustomFlowline.js";
const eventTypes = ['click', 'keydown', 'keyup', 'scroll', 'load'];
eventTypes.forEach(type => {
    const target = type === 'load' ? window : document;
    target.addEventListener(type, (event) => {
        CustomFlowline.fixLine();
    }, false);
});
const customprompt = document.getElementById('customprompt');
const computedStyle = window.getComputedStyle(customprompt);
const nodecontainer = document.getElementById('customnode-wrapper');
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
    function processCustomNode(node, systemArray) {
        var nodeName = node[0];
        var nodeX = node[1][0];
        var nodeY = node[1][1];
        var nodeSystem = node[2];
        var nodeTransform = "translate(0,0)";
        if (node[3]) {
            nodeTransform = node[3];
        }
        let defaultRGB = systemArray.find((system) => { system[0] === "UNKNOWN"; });
        let nodeRGB = defaultRGB ? hexToRGBA(defaultRGB[1], 0.75) : hexToRGBA("#888", 0.75);
        let nodeSys = "UNKNOWN";
        systemArray.forEach((system) => {
            if (system[0] === nodeSystem) {
                nodeSys = system[0];
                nodeRGB = hexToRGBA(system[1], 0.75);
            }
        });
        let nodeItem = CustomNode.getNodebyInfo(nodeName, nodeX, nodeY, nodeSys, nodeTransform);
        if (nodeItem === undefined || nodeItem === null) {
            return new CustomNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, nodecontainer);
        }
        else {
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
                var nodeStart = processCustomNode(nodeStartArray, systemArray);
                var nodeEnd = processCustomNode(nodeEndArray, systemArray);
                if (CustomFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                    continue;
                }
                new CustomFlowline(nodeStart.node, nodeEnd.node);
            }
        });
    }
    let maxNodeY = Math.max(...CustomNode.myCustomNodes.map(node => node.nodeY));
    nodecontainer.style.height = maxNodeY + 'px';
}
function setDOMeditable(editable) {
    let content = document.getElementById('custom-body-wrapper');
    if (editable) {
        content.classList?.remove('readonly');
        content.classList?.add('editable');
    }
    else {
        content.classList?.remove('editable');
        content.classList?.add('readonly');
    }
}
let flowString = document.getElementById('customPromptFlow').innerText;
let flowArray = parseJson(flowString);
let nodeString = document.getElementById('customPromptNode').innerText;
let nodeArray = parseJson(nodeString);
processPrompt(nodeArray, flowArray);
var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
var url = isLocal ? 'http://localhost:8000' : 'https://www.ecocircuitai.com';
var socket = io.connect(url);
socket.on('data_from_playground', function (data) {
    setDOMeditable(false);
    startload();
    var nodeArray = parseJson(data["node"]);
    var flowArray = parseJson(data["flow"]);
    processPrompt(nodeArray, flowArray);
    CustomFlowline.fixLine();
    saveCustom();
    setDOMeditable(true);
    finishload();
});
function saveCustom() {
    let prompt_id = document.getElementById('custom-id').innerHTML;
    let { flow, nodematrix } = returnCustomInfo();
    console.log(flow, nodematrix);
    var image;
}
function returnCustomInfo() {
    let flow = [];
    let flownode = [];
    let nodematrix = {};
    CustomFlowline.myCustomLines.forEach((line) => {
        let tempflowinfo = line.toJSONArray();
        flownode.push(tempflowinfo[0]);
        flownode.push(tempflowinfo[1]);
        flow.push(line.toJSONArray(true));
    });
    CustomNode.myCustomNodes.forEach((node) => {
        if (!flownode.includes(node.nodeContent)) {
            nodematrix = { ...nodematrix, ...node.toJSONObj() };
        }
    });
    return { flow, nodematrix };
}
