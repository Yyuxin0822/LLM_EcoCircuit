import { PromptCanvasDraw } from "../generateplayground/prompt/PromptCanvasDraw.js";
export class CustomCanvasDraw extends PromptCanvasDraw {
    saveCustomCanvas() {
        console.log("saving custom canvas");
        var dataURL = this.canvas.toDataURL("image/png");
        var custom = this.container.querySelector("#custom-id");
        if (!custom)
            return;
        var custom_id = custom.innerHTML;
        const data = new FormData();
        data.append("data_url", dataURL);
        data.append("custom_id", custom_id);
        var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        var url = isLocal ? 'http://localhost:8000/save_customcanvas' : 'https://www.ecocircuitai.com/save_customcanvas';
        if (navigator.sendBeacon(url, data)) {
            console.log("Canvas saved successfully using sendBeacon.");
        }
        else {
            console.error("Error saving canvas using sendBeacon.");
        }
    }
    loadCustomCanvas() {
        console.log("loading custom canvas");
        var custom = this.container.querySelector("#custom-id");
        if (!custom)
            return;
        var custom_id = custom.innerHTML;
        fetch('/load_customcanvas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "custom_id": custom_id })
        })
            .then(response => response.json())
            .then(data => this.processCanvasUrl(data.data_url))
            .catch(error => {
            console.error("Error loading canvas:", error);
        });
    }
}
