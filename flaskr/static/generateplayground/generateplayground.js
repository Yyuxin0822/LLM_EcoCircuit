import { PlaygroundFuncBar } from './PlaygroundFuncBar.js';
import { Prompt } from './prompt/Prompt.js';
import { PromptFlowline } from './prompt/PromptFlowline.js';
import { PromptNode } from './prompt/PromptNode.js';
import { DefaultSystem, System, SystemFuncBar } from '../SystemBar.js';
const eventTypes = ['click', 'keydown', 'keyup', 'scroll', 'load'];
eventTypes.forEach(type => {
    const target = type === 'load' ? window : document;
    target.addEventListener(type, (event) => {
        PromptFlowline.fixLine();
    }, false);
});
window.onload = function () {
    PromptFlowline.fixLine();
    var lastPrompt = Prompt.allPrompts[Prompt.allPrompts.length - 1].prompt;
    var previousElement = lastPrompt.previousElementSibling;
    if (previousElement && !previousElement.classList.contains('hidden')) {
        previousElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(finishload, 500);
    }
    finishload();
};
const playFuncBar = new PlaygroundFuncBar(document.querySelector('.function-frame'));
function loadplayground() {
    document.getElementById('view-playground')?.classList.remove('hidden');
    document.getElementById('view-custom')?.classList.toggle('hidden');
    document.getElementById('content-frame')?.classList.remove('hidden');
    document.getElementById('content-custom-frame').classList.add('hidden');
    document.getElementById('func-wrapper-engbar')?.classList.remove('hidden');
    document.getElementById('func-wrapper-edit')?.classList.remove('hidden');
    document.getElementById('info-frame')?.classList.remove('hidden');
    document.querySelectorAll('.send-to-custom').forEach((button) => {
        button.style.display = 'block';
    });
    playFuncBar.enable();
    setIframeMode(false);
}
function loadcustom() {
    document.getElementById('view-playground')?.classList.add('hidden');
    document.getElementById('view-custom')?.classList.remove('hidden');
    document.getElementById('content-frame')?.classList.add('hidden');
    document.getElementById('content-custom-frame')?.classList.remove('hidden');
    document.getElementById('func-wrapper-engbar')?.classList.add('hidden');
    document.getElementById('func-wrapper-edit')?.classList.add('hidden');
    document.getElementById('info-frame')?.classList.add('hidden');
    document.querySelectorAll('.send-to-custom').forEach((button) => {
        button.style.display = 'none';
    });
    playFuncBar.disable();
    setIframeMode(true);
    window.scrollTo(0, document.body.scrollHeight);
}
document.getElementById('toggle-playground')?.addEventListener('click', loadplayground);
document.getElementById('toggle-custom')?.addEventListener('click', loadcustom);
function toggleEngineerBar() {
    document.getElementById('engineer-bar-unfolded')?.classList.toggle('hidden');
    document.getElementById('engineer-bar-folded')?.classList.toggle('hidden');
}
document.getElementById('fold')?.addEventListener('click', toggleEngineerBar);
document.getElementById('unfold')?.addEventListener('click', toggleEngineerBar);
const systemBar = new SystemFuncBar(document.getElementById('system-bar'));
var systemString = systemBar.container.querySelector('#project-system').innerText;
var systemArray = parseJson(systemString);
console.log(systemArray);
function processSystem(container) {
    systemArray.forEach((system) => {
        let systemIcon = new System(container, system[0], system[1], system[2]);
        DefaultSystem.currentSystems.push({
            "content": system[0],
            "color": system[1],
            "iconUrl": system[2]
        });
    });
}
processSystem(systemBar.container);
let findFeedback = (parentPrompt) => {
    var fbInfo = parentPrompt.querySelector('.prompt-feedbackflow').innerHTML;
    if (fbInfo.trim() == "") {
        return;
    }
    return JSON.parse(fbInfo.trim());
};
function processPrompt(prompt) {
    var prIndex = prompt.id.replace('prompt', '');
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
    let canvas = parentPrompt.querySelector('#canvasDraw');
    canvas.height = ((NodeYMax + 1) * 1.5 + 3) * 16;
    NodeX.forEach((x) => {
        if (parentPrompt.querySelector('#col' + validId(x.toString()))) {
            return;
        }
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
        new PromptNode(nodeName, nodeX, nodeY, nodeTransform, nodeRGB, nodeSys, parentPrompt);
    });
    flowArray.forEach((flow) => {
        for (var i = 1; i < flow.length - 1; i++) {
            var nodeStart = PromptNode.getNodeById('node' + validId(flow[i]), parentPrompt);
            var nodeEnd = PromptNode.getNodeById('node' + validId(flow[i + 1]), parentPrompt);
            if (nodeStart == null || nodeEnd == null || nodeStart.node == nodeEnd.node) {
                return;
            }
            if (PromptFlowline.isLineExists(nodeStart.node, nodeEnd.node)) {
                continue;
            }
            new PromptFlowline(nodeStart.node, nodeEnd.node);
        }
    });
    let feedbackLines = findFeedback(parentPrompt);
    if (feedbackLines) {
        feedbackLines.forEach((line) => {
            promptObject.promptLines.forEach((flowline) => {
                if (flowline.start.querySelector('.node-wrapper').innerText == line[0] && flowline.end.querySelector('.node-wrapper').innerText == line[1]) {
                    flowline.feedback = true;
                    flowline.setFeedbackStyle();
                }
            });
        });
    }
    if (nodeArray.length == 0) {
        parentPrompt.style.display = 'none';
        return;
    }
}
var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);
if (document.querySelector('.prompt-user')) {
    document.querySelector('.prompt-user').classList.add('hidden');
}
const addiotab = document.getElementById('add-io');
addiotab?.addEventListener('click', addio);
function addio() {
    let userConfirmed = confirm('Generate more inspriations from your descriptions. Do you want to proceed?');
    if (!userConfirmed) {
        return;
    }
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
        window.location.reload();
        console.log('load success');
    })
        .finally(() => {
        console.log('finish load');
    });
}
let quickgen = document.getElementById('quickgen');
quickgen?.addEventListener('click', () => {
    let mode = playFuncBar.returnMode();
    if (!mode) {
        alert('Please select a generation mode in controller and some contents to prompt');
        return;
    }
    if (mode == "add-process") {
        let userConfirmed = confirm('The unconfirmed process will not be taken into account in the generation. Do you want to proceed?');
        if (!userConfirmed) {
            return;
        }
    }
    else {
        let userConfirmed = confirm('Your selection will be submitted for generation. Do you want to proceed?');
        if (!userConfirmed) {
            return;
        }
    }
    let { prompt_id_array, query_array } = Prompt.returnAllQuery();
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
        console.log('load success');
    })
        .finally(() => {
        console.log('finish load');
    });
});
let regenImage = document.getElementById('regen-image');
regenImage?.addEventListener('click', () => {
    let userConfirmed = confirm('The current description will be sent to generate a new image. Do you want to proceed?');
    if (!userConfirmed) {
        return;
    }
    startload();
    let project_id = document.getElementById('project_id').innerText;
    let info = document.getElementById('info').innerText;
    fetch('/regen-image', {
        method: 'POST',
        body: JSON.stringify({
            'project_id': project_id,
            'info': info
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
        let imageCanvas = document.getElementById('canvas-image');
        console.log(data['imgurl']);
        imageCanvas.src = data['imgurl'];
        finishload();
    })
        .finally(() => {
        console.log('finish load');
    });
});
const sendAll = document.getElementById('send-all');
sendAll?.addEventListener('click', () => sendDataToCustom('send-all'));
const startSelect = document.getElementById('start-select-for-sending');
const finishSelect = document.getElementById('finish-select-for-sending');
const sendSelected = document.getElementById('send-selected');
const sendprompt = document.querySelectorAll('.send-prompt');
function sendDataToCustom(mode) {
    let project_id = document.getElementById('project_id').innerText;
    let flow_array = [];
    let node_array = {};
    let imgurl_array = {};
    let finalminY = Number.MAX_SAFE_INTEGER;
    Prompt.allPrompts.forEach(prompt => {
        let { flow, nodematrix, minY } = prompt.collectCustomInfo(mode);
        if (flow.length > 0) {
            flow_array = [...flow_array, ...flow];
        }
        if (Object.keys(nodematrix).length > 0) {
            node_array = { ...node_array, ...nodematrix };
        }
        if (finalminY == undefined || minY < finalminY) {
            finalminY = minY;
        }
    });
    let imageCanvas = document.getElementById('canvas-image');
    let imgurl = imageCanvas.src;
    if (finalminY === Number.MAX_SAFE_INTEGER) {
        finalminY = undefined;
    }
    console.log(finalminY);
    let iframe = document.getElementById('custom-iframe');
    let iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    let nodeContainer = iframeDocument.getElementById('customnode-wrapper');
    let nodes = nodeContainer.querySelectorAll('.node');
    let nodeRects = Array.from(nodes).map(node => node.getBoundingClientRect());
    let maxY;
    if (nodeRects.length == 0) {
        maxY = 0;
    }
    else {
        maxY = Math.max(...nodeRects.map(rect => rect.bottom));
    }
    console.log(maxY);
    flow_array.forEach((flow) => {
        flow.forEach((node) => {
            Object.entries(node).forEach(([key, value]) => {
                value[0][1] = value[0][1] - finalminY + maxY;
            });
        });
    });
    Object.entries(node_array).forEach(([key, value]) => {
        value[0][1] = value[0][1] - finalminY + maxY;
    });
    var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    var url = isLocal ? 'http://localhost:8000' : 'https://www.ecocircuitai.com';
    var socket = io(url, {
        path: '/socket.io',
        transports: ['websocket', 'polling']
    });
    socket.emit('send_data_to_custom', {
        'project_id': project_id,
        'flow_array': flow_array,
        'node_array': node_array,
    });
}
