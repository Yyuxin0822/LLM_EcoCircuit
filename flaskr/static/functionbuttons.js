
function showinputoutput(){
  let input=document.getElementById("input")
  let output=document.getElementById("output")
  var buttons=document.querySelectorAll("button .tag")
  // if button is not null
  if(buttons.length>0){
    showtag(input)
    showtag(output)
  }
}  


function hideinputoutput(){
  let input=document.getElementById("input")
  let output=document.getElementById("output")
  hidetag(input)
  hidetag(output)
}  





function downloadJSON(data, filename) {
  var fileData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 4));
  var downloader = document.createElement('a');
  downloader.setAttribute('href', fileData);
  downloader.setAttribute('download', filename);
  downloader.click();
}


menuButton=[];
// create buttons under "tabFunction"
function funcBtn(text,pane){
  // get rid of space in text
  var button = document.createElement('button')
  button.className = 'button';
  button.id = 'button'+text.replace(/\s/g, '');
  let tabFunction = document.getElementById("tab"+pane);
  tabFunction.appendChild(button);
  if (pane==="Function"||pane==="Env"){button.innerHTML = text;}
  else if (pane==="FuncMenu"){
    button.innerHTML = "&#9656  "+text
    // add underline stylye to button
    button.style.textDecoration = "underline";
    menuButton.push(button);
}
}


// funcBtn("Show Simple Flow","Function");
// funcBtn("Show Complex Flow","Function");
funcBtn("Standard View","Function");
funcBtn("Custom View","Function");
funcBtn("Quick Select","Function");
funcBtn("Image","Function");
funcBtn("Canvas","Function");
funcBtn("Show Note","Function");
funcBtn("Ask EcoCircuit AI","Env");

function clearMenu(){
  menuButton.forEach(button => button.remove())}


addGlobalEventListener('click','#buttonShowNote',e=>{
  console.log(e.target.id);
  openModal(document.getElementById('modal'))
})


//////////////////////////////
addGlobalEventListener('click','#buttonStandardView',e=>{
  console.log(e.target.id);
  clearMenu();

  funcBtn("Lookup Simple Flow","FuncMenu");
  funcBtn("Lookup Complexified Processes","FuncMenu");
  funcBtn("Lookup Element Co-optimization","FuncMenu");
  funcBtn("Lookup Selected Only","FuncMenu");
})


addGlobalEventListener('click','#buttonCustomView',e=>{
  console.log(e.target.id);
  clearMenu();
  funcBtn("Custom Simple Flow","FuncMenu");
  funcBtn("Custom Complexified Processes","FuncMenu");
  funcBtn("Custom Element Co-optimization","FuncMenu");
  funcBtn("Custom Selected Only","FuncMenu");
})

addGlobalEventListener('click','#buttonQuickSelect',e=>{
  console.log(e.target.id);
  clearMenu();
  funcBtn("Select All Simple Flow","FuncMenu");
  funcBtn("Select All Inputs","FuncMenu");
  funcBtn("Select All Outputs","FuncMenu");
  funcBtn("Clear All Selections","FuncMenu");
  // funcBtn("Hide All Flow","FuncMenu");
})

addGlobalEventListener('click','#buttonImage',e=>{
  console.log(e.target.id);
  clearMenu();

  funcBtn("Edit Image","FuncMenu");
  funcBtn("Exit Edit Image","FuncMenu");
  funcBtn("Show Creative Image","FuncMenu");
  funcBtn("Hide Creative Image","FuncMenu");
})

addGlobalEventListener('click','#buttonCanvas',e=>{
  console.log(e.target.id);
  clearMenu();

  funcBtn("Enable Draw","FuncMenu");
  funcBtn("Disable Draw","FuncMenu");
  funcBtn("Show Draw","FuncMenu");
  funcBtn("Hide Draw","FuncMenu");
})

// build double click event listener for "field"
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
const fullsystemlist=["HYDRO",'ENERGY','ECOSYSTEM','OTHERS','UNKNOWN']
const fullcolorlist=[colorToRGBA("#00aeef",0.8),colorToRGBA("#ffc60b",0.8),colorToRGBA("#39b54a",0.8),colorToRGBA("lightgrey",0.8),colorToRGBA("lightgrey",0.8)]
const systeminfo =  getData(systemDataUrl);
function findColor(text,system){
  let keytext = text.toUpperCase();
  let foundSystem;
  if (system[text])  {
      foundSystem = system[keytext];
      let index = fullsystemlist.indexOf(foundSystem);
      colortemp= fullcolorlist[index];
  }else {colortemp= fullcolorlist[3];}
  // console.log(colortemp);
  return colortemp;
}

const MAX_DOUBLE_CLICK_TIME = 500;
systeminfo.then(system => {
// Double-click custom event listener
field.addEventListener('custom:doubleClick', e => {
    //... rest of your code for the double-click event

    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.placeholder = 'Input Element Here...';
    inputBox.style.position = 'fixed';  // Example styling, adjust as needed
    inputBox.style.top = e.detail.clientY+ 'px';
    inputBox.style.left =  e.detail.clientX + 'px';
    document.body.appendChild(inputBox);
    inputBox.addEventListener('blur', () => {
        if (inputBox.parentNode) {  document.body.removeChild(inputBox); } // Remove the input from the DOM
      });
    inputBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          if(document.getElementById("tag"+inputBox.value.toUpperCase())===null){
            let keytext = inputBox.value.toUpperCase();
            let inputObject ={key:keytext,color: findColor(keytext,system)};
            var tag = document.createElement("button");
            tag.className = 'tag';
            tag.id = 'tag' + inputObject.key;
            tag.innerHTML = inputObject.key

            Object.assign(tag.style, {
              width: `${tagX}px`,
              height: `${tagY}px`,
              left: `${e.detail.clientX + window.scrollX-175}px`,
              top: `${e.detail.clientY + window.scrollY-270}px`,
              borderRadius: "5px",
              color: "black",
              backgroundColor: inputObject.color,
              border: "1px solid white",
              fontFamily: "arial",
              fontWeight: "bolder",
              position: "absolute",
              whiteSpace: "nowrap",
              zIndex: "2"
            });

            let parent = document.getElementById("field");
            parent.appendChild(tag)
            adjustFontSize(tag);
            if (inputObject.color===fullcolorlist[3]){
            tag.setAttribute("data-user", "true");}
            createDropdown(tag);

            draggable=new PlainDraggable(tag,{containment:{left: fieldRect.x, top: fieldRect.y, width: fieldRect.width, height: fieldRect.height}})}

          if (inputBox.parentNode) {  inputBox.parentNode.removeChild(inputBox); }
        }
    },{capture: true,
      bubbles: false,
      cancelable: true});
  

    inputBox.focus();
});

let lastClick = 0;
field.addEventListener('click', e => {
    // e.stopPropagation();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const timeBetweenClicks = e.timeStamp - lastClick;
    if (timeBetweenClicks > MAX_DOUBLE_CLICK_TIME) {
        lastClick = e.timeStamp;
        return;
    }

    const doubleClickEvent = new CustomEvent('custom:doubleClick', {
        detail: {timeBetweenClicks, clientX, clientY},
        capture: true,
        bubbles: false,
        cancelable: true
    });

    field.dispatchEvent(doubleClickEvent);
    lastClick = 0;
}, {capture: false, bubbles: false});// end of field.addEventListener
})// end of systemInfo.then




// End of double click event listener for canvas
////////////////////////////////////////////////////




// selet all buttons under tabFunction
addGlobalEventListener('auxclick', 'button.tag', e => {
  if (e.button === 1) {
      console.log(e.target.id);
      let button = document.getElementById(e.target.id);
      hidetag(button);

      lineLibrary.forEach(lineObject => {
        if (lineObject.tagStart === e.target.id.substring(3) || lineObject.tagEnd === e.target.id.substring(3)){
          lineObject.line.hide('none');
        }
      })
      e.preventDefault();  // To prevent default behavior of middle-click
  }
});


