function addGlobalEventListener(type,selector,callback){
    document.addEventListener(type,e=>{
        if(e.target.matches(selector)) callback(e);
    })
  }

function addCustomDbclickEventListener(selector, callback, interval = 300) {
  let lastClickTime = 0;
  document.addEventListener('click', (e) => {
      const dot = e.target.closest(selector);
      if (!dot) return; // Exit if clicked element does not match the selector

      const now = Date.now();
      if (now - lastClickTime <= interval) {
          callback(e); // Trigger the custom double-click callback
      }
      lastClickTime = now; // Update the last click time
  });
}



function finishload(){
  const loader = document.querySelector(".loader");

  loader?.classList.add("loader-hidden");

  loader?.addEventListener("transitionend", ()=>{
    loader?.parentElement?.removeChild(loader);
  });
};


function startload(){
  console.log("Window To Load");  
  let loader = document.createElement("div");
  loader.className = 'loader';
  document.body.appendChild(loader);
}
    
function hexToRGBA(hex, opacity) {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Solve 3digit hex color
  if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
  }

  // Parse the hex string into numeric values
  let r = parseInt(hex.substring(0, 2), 16); // Red
  let g = parseInt(hex.substring(2, 4), 16); // Green
  let b = parseInt(hex.substring(4, 6), 16); // Blue

  // Return the formatted RGBA color string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}


function validId(nodeName) {
  // Replace problematic characters with dashes and remove leading/trailing non-alphanumeric characters
  return nodeName
      .replace(/[\s,().]+/g, '-') // Replace spaces, commas, and parentheses with dashes
      .replace(/--+/g, '-') // Replace multiple consecutive dashes with a single dash
      .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
      .replace(/[^\w-]+/g, ''); // Remove any remaining non-word characters (excluding dashes)
}

function parseJson(jsonString) {
  var nodeObject = JSON.parse(jsonString);
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
