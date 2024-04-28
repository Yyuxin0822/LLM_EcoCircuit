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
            var nodeTransform = node[2];
            var nodeRGB = node[3];
            var nodeItem = new NodeItem(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, customPromptWrapper);
        });
    }

    if (flowArray.length != 0) {
        flowArray.forEach((flow) => {
            for (var i = 1; i < flow.length - 1; i++) {
                var nodeStart = NodeItem.getNodeById('node' + validId(flow[i]));
                var nodeEnd = NodeItem.getNodeById('node' + validId(flow[i + 1]));
                nodeStart.setIdentifier('input-identifier');
                nodeEnd.setIdentifier('output-identifier');
                //check if there is a line between the two nodes
                if (CustomFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                    continue;
                }
                var line = new CustomFlowline(nodeStart.node, nodeEnd.node);
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
var socket = io.connect('http://localhost:5000');
socket.on('data_from_playground', function (data) {
    //console.log(data);
    //console.log(data["node"]);
    //console.log(data["flow"]);
    //get the type of data["node"] and data["flow"]
    var nodeArray = parseJson(data["node"]);
    var flowArray = parseJson(data["flow"]);
    processPrompt(nodeArray, flowArray);
    saveCustom();
});


function saveCustom() {
    let { prompt_id, flow, nodematrix } = returnInfo();
    //let system = JSON.parse(document.getElementById('customPromptSystem').innerHTML);
    var image;
    var canvas;
    socket.emit('save_custom', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix});
}

setInterval(saveCustom, 180000); //auto save every 3 minutes
window.addEventListener('beforeunload', function (event) {
    saveCustom();  // Call the save function
    event.preventDefault(); // Prevent the default action
    //event.returnValue = 'Are you sure you want to leave?';
});

function returnInfo() {
    let flow = [];
    let nodematrix = absPostionMatrix(customprompt);
    prompt_id = document.getElementById('custom-id').innerHTML;
    CustomFlowline.myCustomLines.forEach((line) => {
        console.log(line);
        try {
            tempflow = [];
            let start = line.start.querySelector('.node-wrapper').innerHTML;
            let end = line.end.querySelector('.node-wrapper').innerHTML;
            tempflow.push(start);
            tempflow.push(end);
            flow.push(tempflow);
        } catch (e) {
            console.log(e);
        }

    })
    return { prompt_id, flow, nodematrix };
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
        let absPosition = [parseFloat(node.style.left), parseFloat(node.style.top)]
        absMatrix[nodewrapper.innerHTML] = [absPosition, node.style.transform, node.style.backgroundColor];
    })
    return absMatrix;
}

