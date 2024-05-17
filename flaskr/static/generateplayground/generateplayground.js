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
const iframe = document.getElementById('custom-iframe');
function loadplayground() {
    document.getElementById('view-playground')?.classList.remove('hidden');
    document.getElementById('view-custom')?.classList.toggle('hidden');
    document.getElementById('content-frame')?.classList.remove('hidden');
    document.getElementById('content-custom-frame').classList.add('hidden');
    document.getElementById('func-wrapper-engbar')?.classList.remove('hidden');
    document.getElementById('func-wrapper-edit')?.classList.remove('hidden');
    document.querySelectorAll('.send-to-custom').forEach((button) => {
        button.style.display = 'block';
    });
    setIframeMode(false);
}
function loadcustom() {
    document.getElementById('view-playground')?.classList.add('hidden');
    document.getElementById('view-custom')?.classList.remove('hidden');
    document.getElementById('content-frame')?.classList.add('hidden');
    document.getElementById('content-custom-frame')?.classList.remove('hidden');
    document.getElementById('func-wrapper-engbar')?.classList.add('hidden');
    document.getElementById('func-wrapper-edit')?.classList.add('hidden');
    document.querySelectorAll('.send-to-custom').forEach((button) => {
        button.style.display = 'none';
    });
    setIframeMode(true);
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
    var userPrompt = parentPrompt.previousElementSibling;
    var userInfoElement = userPrompt.querySelector('.userinfo');
    if (userInfoElement) {
        var feedbackInfo = userInfoElement.innerHTML.trim();
        var feedbackType = feedbackInfo.split(' ')[0];
        if (feedbackType != 'Feedback' && feedbackType != 'Regeneration') {
            return;
        }
        var regex = /\s*(.*?)\s*--&gt;\s*(.*?)\s*(?=<br>|$)/g;
        var matches, pairs = [];
        while (matches = regex.exec(feedbackInfo)) {
            pairs.push([matches[1], matches[2]]);
        }
        return pairs;
    }
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
                });
            });
        }
        return;
    }
}
var prompts = document.querySelectorAll('.prompt');
prompts.forEach(processPrompt);
document.querySelector('.prompt-user').classList.add('hidden');
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
function setIframeMode(editable) {
    if (editable) {
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
        iframe.classList?.add('editable');
        iframe.classList?.remove('readonly');
    }
    else {
        iframe.setAttribute('sandbox', 'allow-same-origin');
        iframe.classList?.remove('editable');
        iframe.classList?.add('readonly');
    }
}
window.addEventListener('message', (event) => {
    if (event.data === 'clickinside') {
        setIframeMode(true);
    }
});
document.addEventListener('click', (e) => {
    if (!iframe.contains(e.target) && !e.target.closest('.func-wrapper-view')) {
        iframe.contentWindow.postMessage('clickOutside', '*');
        setIframeMode(false);
    }
});
let sendAll = document.getElementById('send-all');
let sendSelected = document.getElementById('send-selected');
sendAll?.addEventListener('click', sendDataToCustom('send-all'));
function sendDataToCustom(mode) {
    let project_id = document.getElementById('project_id').innerText;
    let flow_array = [];
    let node_array = {};
    Prompt.allPrompts.forEach(prompt => {
        let { flow, nodematrix } = prompt.collectCustomInfo(mode);
        if (flow.length > 0) {
            flow_array = [...flow_array, ...flow];
        }
        if (Object.keys(nodematrix).length > 0) {
            node_array = { ...node_array, ...nodematrix };
        }
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
function savePlayground() {
    let project_id = document.getElementById('project_id').innerHTML;
    let { prompt_id, flow, nodematrix } = Prompt.returnAllInfo();
    emitSocket('save_prompt', { "prompt_id": prompt_id, "flow": flow, "node": nodematrix, "project_id": project_id });
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
