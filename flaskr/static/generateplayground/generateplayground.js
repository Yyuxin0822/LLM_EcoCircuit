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
window.onload = function () {
    PromptFlowline.fixLine();
    var lastPrompt = Prompt.allPrompts[Prompt.allPrompts.length - 1].prompt;
    var previousElement = lastPrompt.previousElementSibling;
    if (previousElement && !previousElement.classList.contains('hidden')) {
        previousElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    finishload();
};
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
            if (nodeStart == null || nodeEnd == null) {
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
                });
            });
        }
        return;
    }
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
        console.log('finish load');
    });
});
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
    let nodeparent = node.closest('.prompt-frame');
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
