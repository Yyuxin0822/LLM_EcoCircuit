
function addGlobalEventListener(type, selector, callback) {
  document.addEventListener(type, e => {
    if (e.target.matches(selector)) callback(e);
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



function finishload() {
  const loader = document.querySelector(".loader");

  loader?.classList.add("loader-hidden");

  loader?.addEventListener("transitionend", () => {
    loader?.parentElement?.removeChild(loader);
  });
};


function startload() {
  console.log("Window To Load");
  let loader = document.createElement("div");
  loader.className = 'loader';
  document.body.appendChild(loader);
}

function hexToRGBA(input, opacity) {
  // Check if input is in RGBA format
  if (input.startsWith('rgba')) {
    return input; // Skip if it's already in RGBA format
  }
  
  // Check if input is in RGB format
  if (input.startsWith('rgb')) {
    // Extract the RGB values
    let rgbValues = input.match(/\d+/g);
    let r = rgbValues[0];
    let g = rgbValues[1];
    let b = rgbValues[2];
    
    // Return the formatted RGBA color string
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // If input is in HEX format, remove the hash at the start if it's there
  let hex = input.replace(/^#/, '');

  // Solve 3-digit hex color
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



// // Set a timeout for the AJAX request
// var timeout = setTimeout(function () {
//   alert('The server is taking too long to respond. We are reloading your request.');
//   window.location.reload();  // Reload the page
// }, 10000);  // for example, 29 seconds

// function fetchData() {
//   fetch('/')
//     .then(response => response.json())
//     .then(data => {
//       clearTimeout(timeout);  // Clear the timeout if the data is received in time
//       console.log(data);
//       // Handle your data here
//     })
//     .catch(error => {
//       console.error('Error:', error);
//       clearTimeout(timeout);
//       // Optionally handle errors specifically here if needed
//     });
// }

// fetchData();  // Call your function that makes the AJAX request

function emitSocket(endpoint, data) {
  // Determine if the app is running locally or on a production server
  var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  var url = isLocal ? 'http://localhost:8000' : 'https://www.ecocircuitai.com';

  // Initialize the Socket.IO client
  var socket = io(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });
  return new Promise((resolve, reject) => {
    socket.emit(endpoint, data, response => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });


}
