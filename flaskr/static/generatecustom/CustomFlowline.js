import { CustomNode } from "./CustomNode.js";
export class CustomFlowline extends LeaderLine {
    constructor(start, end) {
        if (CustomFlowline.isLineExists(start, end)) {
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
        CustomFlowline.myCustomLines.push(this);
    }
    updatePositionOptions() {
        let startRect = this.start.getBoundingClientRect();
        let endRect = this.end.getBoundingClientRect();
        if ((endRect.left - startRect.left) <= 225) {
            this.setOptions({
                startSocket: 'Right', endSocket: 'Left',
                startSocketGravity: [150, 0], endSocketGravity: [-150, 0],
            });
        }
        else {
            this.setOptions({
                startSocket: 'Right', endSocket: 'Left',
                startSocketGravity: [150, 0], endSocketGravity: [-150, 0],
            });
        }
        let startIdentifier = this.start.querySelector('.input-identifier');
        let endIdentifier = this.end.querySelector('.output-identifier');
        if (startIdentifier) {
            startIdentifier.style.right = "0rem";
        }
        if (endIdentifier) {
            endIdentifier.style.left = "0rem";
        }
    }
    toJSONArray(abs = false) {
        if (!abs) {
            let startText = this.start.querySelector('.node-wrapper').innerHTML;
            let endText = this.end.querySelector('.node-wrapper').innerHTML;
            return [startText, endText];
        }
        if (abs) {
            let startNode = CustomNode.getNodeObjbyNode(this.start);
            let endNode = CustomNode.getNodeObjbyNode(this.end);
            return [startNode.toJSONObj(true), endNode.toJSONObj(true)];
        }
    }
    remove() {
        super.remove();
        let index = CustomFlowline.myCustomLines.indexOf(this);
        if (index > -1) {
            CustomFlowline.myCustomLines.splice(index, 1);
        }
    }
    static setSelectedFlowStyle() {
        console.log('Selected Flow');
        if (!CustomFlowline.customLineSel)
            return;
        CustomFlowline.getAllLines().forEach((line) => {
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
    static isLineExists(start, end) {
        return CustomFlowline.myCustomLines.some(line => (line.start === start && line.end === end) || (line.start === end && line.end === start));
    }
    static fixLine() {
        CustomFlowline.getAllLines().forEach((line) => {
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
        return CustomFlowline.myCustomLines;
    }
}
CustomFlowline.myCustomLines = [];
CustomFlowline.customLineSel = true;
CustomFlowline.customLineAdd = false;
