import { PlaygroundFuncBar } from './PlaygroundFuncBar.js';
import { Prompt } from './prompt/Prompt.js';
import { PromptFlowline } from './prompt/PromptFlowline.js';
import { PromptNode } from './prompt/PromptNode.js';
const playFuncBar = new PlaygroundFuncBar(document.querySelector('.function-frame'));
const eventTypes = ['click', 'keydown', 'keyup', 'scroll', 'load'];
eventTypes.forEach(type => {
    const target = type === 'load' ? window : document;
    target.addEventListener(type, (event) => {
        PromptFlowline.fixLine();
    }, false);
});
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
        col.style.left = coorXMap[x] + 'rem';
        parentPrompt.appendChild(col);
    });
    nodeArray.forEach((node, nIndex) => {
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
        var promptNode = new PromptNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, parentPrompt);
    });
    flowArray.forEach((flow) => {
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
function toggleEngineerBar() {
    document.getElementById('engineer-bar-unfolded')?.classList.toggle('hidden');
    document.getElementById('engineer-bar-folded')?.classList.toggle('hidden');
}
document.getElementById('fold')?.addEventListener('click', toggleEngineerBar);
document.getElementById('unfold')?.addEventListener('click', toggleEngineerBar);
var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);
const addiotab = document.getElementById('add-io');
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
        window.location.reload();
        console.log('load success');
    })
        .finally(() => {
    });
}
let quickgen = document.getElementById('quickgen');
quickgen?.addEventListener('click', () => {
    let mode = playFuncBar.returnMode();
    if (!mode)
        return;
    let { prompt_id_array, query_array } = Prompt.returnAllQuery();
    console.log(prompt_id_array, query_array);
    if (prompt_id_array.length == 0)
        return;
    startload();
    fetch('/quickgen', {
        method: 'POST',
        body: JSON.stringify({
            'mode': mode,
            'prompt_id_array': prompt_id_array,
            'info_array': query_array,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
        window.location.reload();
        console.log('load success');
    })
        .finally(() => {
        finishload();
    });
});
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
                if (line.start.closest(".prompt") == prompt) {
                    promptinfo.push(tempNode);
                }
            });
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
        }
        else {
            return;
        }
    });
    return { prompt_id, info, currentmatrix };
}
function absPostionMatrix(prompt) {
    let absMatrix = {};
    var nodewrapper = prompt.querySelectorAll('.node-wrapper');
    nodewrapper.forEach((nodewrapper) => {
        let node = nodewrapper.closest('.node');
        let absPosition = getnodePositionInDOM(node);
        absMatrix[nodewrapper.innerHTML] = [absPosition, node.style.transform, node.style.backgroundColor];
    });
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
