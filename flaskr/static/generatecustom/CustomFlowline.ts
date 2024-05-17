import { CustomNode } from "./CustomNode";

export class CustomFlowline extends LeaderLine {
  //field declaration
  static myCustomLines = [];
  static customLineSel = true;
  static customLineAdd = false;
  start: HTMLElement;
  end: HTMLElement;
  commonOptions: {}; //common options for all lines

  constructor(start, end) {
    if (CustomFlowline.isLineExists(start, end)) {
      return;
    }

    super(start, end);
    this.start = start;
    this.end = end;
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
      // startLabel: LeaderLine.captionLabel('Feedback', {color: 'black', offset: [0, -10]}),
    };

    // Assuming updatePositionOptions is intended to be an instance method, not static
    this.setOptions({ ...this.commonOptions });
    CustomFlowline.myCustomLines.push(this);
  }

  //methods
  updatePositionOptions() {
    let startRect = this.start.getBoundingClientRect();
    let endRect = this.end.getBoundingClientRect();
    //if startRect is within 100px to the left of endRect, then set gravity differently
    if ((endRect.left - startRect.left) <= 225) {
      this.setOptions({
        startSocket: 'Right', endSocket: 'Left',
        startSocketGravity: [150, 0], endSocketGravity: [-150, 0],
        // dash: false
      });
    } else {
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

  // equals(otherLine) {
  //   if (!(otherLine instanceof CustomFlowline)) {
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

  remove() {
    super.remove();
    let index = CustomFlowline.myCustomLines.indexOf(this);
    if (index > -1) {
      CustomFlowline.myCustomLines.splice(index, 1);
    }
  }

  static setSelectedFlowStyle() {
    console.log('Selected Flow');
    if (!CustomFlowline.customLineSel) return;

    CustomFlowline.getAllLines().forEach((line) => {
      let inputIdentifier = line.start.querySelector('.input-identifier');
      let outputIdentifier = line.end.querySelector('.output-identifier');
      if (inputIdentifier && outputIdentifier) {
        let inputIdentifierDot = inputIdentifier.querySelector('.identifier-dot');
        let outputIdentifierDot = outputIdentifier.querySelector('.identifier-dot');
        if (inputIdentifierDot.classList.contains('identifier-selected') && outputIdentifierDot.classList.contains('identifier-selected')) {
          //change the line style to selected style
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
    })
  };



  static isLineExists(start, end) {
    return CustomFlowline.myCustomLines.some(line =>
      (line.start === start && line.end === end) || (line.start === end && line.end === start));
  }


  static fixLine() {
    CustomFlowline.getAllLines().forEach((line) => {
      try {
        line?.position();
        line?.updatePositionOptions();
      } catch (e) {
        console.log(e);
      }
    });
  }

  static getAllLines() {
    return CustomFlowline.myCustomLines;
  }
}




//eventListeners
//this function add event listener to the identifier to this.start, and this.end
//this function actually works as an observer


