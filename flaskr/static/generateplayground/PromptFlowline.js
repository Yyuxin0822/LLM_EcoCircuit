import { Prompt } from './Prompt.js';
import { PromptNode } from './PromptNode.js';
export class PromptFlowline extends LeaderLine {
    constructor(start, end) {
        if (PromptFlowline.isLineExists(start, end)) {
            return;
        }
        super(start, end);
        this.start = start;
        this.end = end;
        this.commonOptions = {
            startPlug: "hidden",
            startPlugSize: 4,
            endPlug: "arrow1",
            endPlugSize: 1,
            size: 4,
            gradient: true,
            path: 'fluid',
            startPlugOutline: false,
            outline: false,
            endPlugOutline: false,
            outlineSize: 4,
            outlineColor: 'black',
            hide: false,
            startPlugColor: this.start.style.backgroundColor,
            endPlugColor: this.end.style.backgroundColor,
            startPlugOutlineColor: this.start.style.backgroundColor,
        };
        this.setOptions({ ...this.commonOptions });
        PromptFlowline.myLines.push(this);
        this.addLineToPrompt();
    }
    addLineToPrompt() {
        let prompt = this.start.closest('.prompt');
        let promptItem = Prompt.getPromptItembyPrompt(prompt);
        promptItem.promptLines.push(this);
    }
    updatePositionOptions() {
        let startRect = this.start.getBoundingClientRect();
        let endRect = this.end.getBoundingClientRect();
        let startIdentifier = this.start.querySelector('.input-identifier');
        let endIdentifier = this.end.querySelector('.output-identifier');
        if (startRect.left <= endRect.left) {
            this.setOptions({
                startSocket: 'Right', endSocket: 'Left',
                startSocketGravity: [150, 0], endSocketGravity: [-150, 0],
                dash: false
            });
            if (startIdentifier) {
                startIdentifier.style.right = "0rem";
            }
            if (endIdentifier) {
                endIdentifier.style.left = "0rem";
            }
        }
        else {
            this.setOptions({
                startSocket: 'Left', endSocket: 'Right',
                startSocketGravity: [-150, 0], endSocketGravity: [150, 0],
                dash: { animation: true, len: 12, gap: 6 }
            });
            if (startIdentifier) {
                startIdentifier.style.right = "11rem";
            }
            if (endIdentifier) {
                endIdentifier.style.left = "11rem";
            }
        }
    }
    equals(otherLine) {
        if (!(otherLine instanceof PromptFlowline)) {
            return false;
        }
        return this.start === otherLine.start && this.end === otherLine.end;
    }
    toJSONArray() {
        let startText = this.start.querySelector('.node-wrapper').innerHTML;
        let endText = this.end.querySelector('.node-wrapper').innerHTML;
        return [startText, endText];
    }
    remove() {
        super.remove();
        let index = PromptFlowline.myLines.indexOf(this);
        if (index > -1) {
            PromptFlowline.myLines.splice(index, 1);
        }
        let prompt = this.start.closest('.prompt');
        let promptItem = Prompt.getPromptItembyPrompt(prompt);
        index = promptItem.promptLines.indexOf(this);
        if (index > -1) {
            promptItem.promptLines.splice(index, 1);
        }
    }
    static setSelectedFlowStyle() {
        console.log('Selected Flow');
        if (!PromptFlowline.lineSel)
            return;
        PromptFlowline.getAllLines().forEach((line) => {
            let inputIdentifier = line.start.querySelector('.input-identifier');
            let outputIdentifier = line.end.querySelector('.output-identifier');
            if (inputIdentifier && outputIdentifier) {
                let inputIdentifierDot = inputIdentifier.querySelector('.identifier-dot');
                let outputIdentifierDot = outputIdentifier.querySelector('.identifier-dot');
                if (inputIdentifierDot.classList.contains('identifier-selected') && outputIdentifierDot.classList.contains('identifier-selected')) {
                    line.setOptions({
                        startPlugColor: 'black',
                        endPlugColor: 'black',
                        outline: true,
                        outlineColor: 'black',
                        endPlugOutline: true,
                        outlineSize: 4
                    });
                }
            }
        });
    }
    ;
    static rmSelFlowStyle() {
        PromptFlowline.myLines.forEach(line => {
            line.setOptions({
                startPlugColor: line.start.style.backgroundColor,
                endPlugColor: line.end.style.backgroundColor,
                outline: false,
                endPlugOutline: false
            });
            line.position();
        });
    }
    static addAllIdentifiers() {
        PromptFlowline.myLines.forEach(line => {
            var nodeStart = PromptNode.getNodeObjbyNode(line.start, line.start.closest('.prompt'));
            var nodeEnd = PromptNode.getNodeObjbyNode(line.end, line.start.closest('.prompt'));
            nodeStart.setIdentifier('input-identifier');
            nodeEnd.setIdentifier('output-identifier');
        });
    }
    static rmAllIdentifiers() {
        PromptFlowline.myLines.forEach(line => {
            var nodeStart = PromptNode.getNodeObjbyNode(line.start, line.start.closest('.prompt'));
            var nodeEnd = PromptNode.getNodeObjbyNode(line.end, line.start.closest('.prompt'));
            nodeStart.rmIdentifier('input-identifier');
            nodeEnd.rmIdentifier('output-identifier');
        });
    }
    static isLineExists(start, end) {
        return PromptFlowline.myLines.some(line => (line.start === start && line.end === end) || (line.start === end && line.end === start));
    }
    static fixLine() {
        PromptFlowline.getAllLines().forEach((line) => {
            try {
                line?.position();
                line?.updatePositionOptions();
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    static getAllLines() {
        return PromptFlowline.myLines;
    }
}
PromptFlowline.myLines = [];
PromptFlowline.lineSel = true;
