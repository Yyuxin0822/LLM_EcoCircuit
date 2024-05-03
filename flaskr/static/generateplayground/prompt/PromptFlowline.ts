//@ts-ignore
import { Prompt } from './Prompt.js';
//@ts-ignore
import { PromptNode } from './PromptNode.js';
//@ts-ignore
import { PromptIdentifier } from './PromptIdentifier.js';


export class PromptFlowline extends LeaderLine {
  //field declaration
  static myLines = [];
  static lineSel = true;
  static lineAdd = false;
  start: HTMLElement;
  startNodeItem: PromptNode;
  end: HTMLElement;
  endNodeItem: PromptNode;
  prompt: HTMLElement;
  promptItem: Prompt;
  commonOptions: {}; //common options for all lines
  selected: boolean;

  //constructor
  constructor(start: HTMLElement, end: HTMLElement) {
    if (PromptFlowline.isLineExists(start, end)) {
      return;
    }

    super(start, end);
    this.start = start;
    this.end = end;
    this.prompt = this.start.closest('.prompt') as HTMLElement;
    this.startNodeItem = PromptNode.getNodeObjbyNode(this.start, this.prompt);
    this.endNodeItem = PromptNode.getNodeObjbyNode(this.end, this.prompt);
    this.selected = false;
    // Initialize commonOptions here where start and end are defined
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

    // Assuming updatePositionOptions is intended to be an instance method, not static
    this.setOptions({ ...this.commonOptions });
    PromptFlowline.myLines.push(this);
    this.addLineToPrompt();
  }

  //methods
  addLineToPrompt() {
    let prompt = this.start.closest('.prompt') as HTMLElement;
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
    } else {
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

  updateColorOptions() {
    this.setOptions({
      startPlugColor: this.start.style.backgroundColor,
      endPlugColor: this.end.style.backgroundColor,
      startPlugOutlineColor: this.start.style.backgroundColor,
    });

  }

  // equals(otherLine) {
  //   if (!(otherLine instanceof PromptFlowline)) {
  //     return false;
  //   }
  //   // Check if both the start and end elements are the same
  //   return this.start === otherLine.start && this.end === otherLine.end;
  // }

  toJSONArray() {
    let startText = this.start.querySelector('.node-wrapper').innerHTML;
    let endText = this.end.querySelector('.node-wrapper').innerHTML;
    return [startText, endText];
  }

  select() {
    //select the line
    if (this.selected) return;
    this.setOptions({
      startPlugColor: 'black',
      endPlugColor: 'black',
      outline: true,
      outlineColor: 'black',
      endPlugOutline: true,
      outlineSize: 4
    });

    //select the identifiers
    this.startNodeItem.inputIdentifier.select();
    this.endNodeItem.outputIdentifier.select();
    this.selected = true;
  }

  unselect() {
    //unselect the line
    if (!this.selected) return;
    this.setOptions({
      startPlugColor: this.start.style.backgroundColor,
      endPlugColor: this.end.style.backgroundColor,
      outline: false,
      endPlugOutline: false
    });
    this.selected = false;
    //unselect the identifiers
    // this.startNodeItem.inputIdentifier.unselect();
    // this.endNodeItem.outputIdentifier.unselect();
  }


  remove() {
    let prompt = null;
    if (this.start) {
      prompt = this.start.closest('.prompt') as HTMLElement;
    }
    if (this.end) {
      prompt = this.end.closest('.prompt') as HTMLElement;
    }//timing important!
    if (!prompt) return; // this get prompt step is critical because when deleting a node, the line node might be removed first.

    let promptItem = Prompt.getPromptItembyPrompt(prompt); //timing important!

    super.remove();

    //remove in PromptFlowline.myLines
    let index = PromptFlowline.myLines.indexOf(this);
    if (index > -1) {
      PromptFlowline.myLines.splice(index, 1);
    }

    //remove in this.promptItem.promptLines.
    index = promptItem.promptLines.indexOf(this);
    if (index > -1) {
      promptItem.promptLines.splice(index, 1);
    }


    promptItem.returnInfo(); // save the info immediately after removing the line
  }


  // static setSelectedFlowStyle() {
  //   console.log('Selected Flow');
  //   if (!PromptFlowline.lineSel) return;

  //   PromptFlowline.getAllLines().forEach((line) => {
  //     let inputIdentifier = line.start.querySelector('.input-identifier');
  //     let outputIdentifier = line.end.querySelector('.output-identifier');
  //     if (inputIdentifier && outputIdentifier) {
  //       let inputIdentifierDot = inputIdentifier.querySelector('.identifier-dot');
  //       let outputIdentifierDot = outputIdentifier.querySelector('.identifier-dot');
  //       if (inputIdentifierDot.classList.contains('identifier-selected') && outputIdentifierDot.classList.contains('identifier-selected')) {
  //         //change the line style to selected style
  //         line.setOptions({
  //           startPlugColor: 'black',
  //           endPlugColor: 'black',
  //           outline: true,
  //           outlineColor: 'black',
  //           endPlugOutline: true,
  //           outlineSize: 4
  //         });
  //       }
  //     }
  //   })
  // };



  // static setConnectionStyle(endSelected: HTMLElement) {
  //   let nodeItem = PromptNode.getNodeObjbyNode(endSelected, endSelected.closest('.prompt') as HTMLElement);
  //   let promptItem = Prompt.getPromptItembyPrompt(endSelected.closest('.prompt') as HTMLElement);

  //   if (!PromptFlowline.lineSel) return;

  //   this.setOptions({
  //     startPlugColor: 'black',
  //     endPlugColor: 'black',
  //     outline: true,
  //     outlineColor: 'black',
  //     endPlugOutline: true,
  //     outlineSize: 4
  //   });


  //   let startLines 
  // }


  static rmAllSelFlow() {
    PromptFlowline.myLines.forEach(line => line.unselect());
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
    return PromptFlowline.myLines.some(line =>
      (line.start === start && line.end === end) || (line.start === end && line.end === start));
  }

  static fixLine() {
    PromptFlowline.getAllLines().forEach((line) => {
      try {

        line?.position();
        line?.updatePositionOptions();
        if (!PromptFlowline.lineSel && !PromptNode.nodeSel) {
          line?.updateColorOptions();
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  static getAllLines() {
    return PromptFlowline.myLines;
  }

  static getLinebyEndTexts(startText: string, endText: string): PromptFlowline {
    return PromptFlowline.myLines.find(line => {
      let startNode = line.start.querySelector('.node-wrapper').innerHTML;
      let endNode = line.end.querySelector('.node-wrapper').innerHTML;
      return startNode === startText && endNode === endText;
    });
  }


}