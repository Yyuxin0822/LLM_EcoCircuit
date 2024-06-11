export class PromptCanvasDraw {
    constructor(canvasId, container) {
        this.container = container;
        this.canvas = container.querySelector(`#${canvasId}`);
        this.context = this.canvas.getContext("2d");
        this.colour = "rgb(30, 30, 30)";
        this.strokeWidth = 4;
        this.drawing = false;
        this.latestPoint = null;
        this.handlers = {
            touchStart: this.touchStart.bind(this),
            touchMove: this.touchMove.bind(this),
            touchEnd: this.touchEnd.bind(this),
            mouseDown: this.mouseDown.bind(this),
            mouseMove: this.mouseMove.bind(this),
            mouseUp: this.endStroke.bind(this),
            mouseOut: this.endStroke.bind(this),
            mouseEnter: this.mouseEnter.bind(this),
            keyDownEvt: this.keyDownEvt.bind(this)
        };
        this.disable();
        this.enabled = false;
        PromptCanvasDraw.promptDrawInstances.push(this);
        window.onbeforeunload = this.saveAllCanvases.bind(this);
        window.addEventListener("DOMContentLoaded", this.loadCanvas.bind(this));
        window.addEventListener("keydown", this.handlers.keyDownEvt, false);
    }
    attachEventListeners() {
        this.canvas.addEventListener("touchstart", this.handlers.touchStart, false);
        this.canvas.addEventListener("touchmove", this.handlers.touchMove, false);
        this.canvas.addEventListener("touchend", this.handlers.touchEnd, false);
        this.canvas.addEventListener("touchcancel", this.handlers.touchEnd, false);
        this.canvas.addEventListener("mousedown", this.handlers.mouseDown, false);
        this.canvas.addEventListener("mouseup", this.handlers.mouseUp, false);
        this.canvas.addEventListener("mouseout", this.handlers.mouseOut, false);
        this.canvas.addEventListener("mouseenter", this.handlers.mouseEnter, false);
    }
    detachEventListeners() {
        this.canvas.removeEventListener("touchstart", this.handlers.touchStart, false);
        this.canvas.removeEventListener("touchmove", this.handlers.touchMove, false);
        this.canvas.removeEventListener("touchend", this.handlers.touchEnd, false);
        this.canvas.removeEventListener("touchcancel", this.handlers.touchEnd, false);
        this.canvas.removeEventListener("mousedown", this.handlers.mouseDown, false);
        this.canvas.removeEventListener("mouseup", this.handlers.mouseUp, false);
        this.canvas.removeEventListener("mouseout", this.handlers.mouseOut, false);
        this.canvas.removeEventListener("mouseenter", this.handlers.mouseEnter, false);
    }
    keyDownEvt(evt) {
        if (evt.key === '+' || evt.key === '=') {
            this.strokeWidth = Math.min(this.strokeWidth + 1, 100);
        }
        else if (evt.key === '-' || evt.key === '_') {
            this.strokeWidth = Math.max(this.strokeWidth - 1, 1);
        }
    }
    enable() {
        if (this.enabled)
            return;
        this.container.classList.add('disable-pointer-events');
        this.attachEventListeners();
        this.enabled = true;
    }
    disable() {
        if (!this.enabled)
            return;
        this.detachEventListeners();
        this.container.classList.remove('disable-pointer-events');
        if (this.drawing) {
            this.endStroke();
        }
        this.enabled = false;
    }
    mouseButtonIsDown(buttons) {
        return (this.BUTTON & buttons) === this.BUTTON;
    }
    middleButtonIsDown(buttons) {
        return (this.MIDDLE_BUTTON & buttons) === this.MIDDLE_BUTTON;
    }
    startStroke(point) {
        this.drawing = true;
        this.latestPoint = point;
    }
    continueStroke(newPoint) {
        this.context.beginPath();
        this.context.moveTo(this.latestPoint[0], this.latestPoint[1]);
        this.context.strokeStyle = this.colour;
        this.context.lineWidth = this.strokeWidth;
        this.context.lineCap = "round";
        this.context.lineJoin = "round";
        this.context.lineTo(newPoint[0], newPoint[1]);
        this.context.stroke();
        this.latestPoint = newPoint;
    }
    endStroke() {
        if (!this.drawing)
            return;
        this.drawing = false;
        this.context.globalCompositeOperation = 'source-over';
        this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this), false);
    }
    mouseDown(evt) {
        if (this.drawing)
            return;
        evt.preventDefault();
        const operation = evt.button === 1 ? 'destination-out' : 'source-over';
        this.context.globalCompositeOperation = operation;
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this), false);
        this.startStroke([evt.offsetX, evt.offsetY]);
    }
    mouseMove(evt) {
        if (!this.drawing)
            return;
        this.continueStroke([evt.offsetX, evt.offsetY]);
    }
    mouseEnter(evt) {
        const operation = this.middleButtonIsDown(evt.buttons) ? 'destination-out' : 'source-over';
        this.context.globalCompositeOperation = operation;
        if ((this.mouseButtonIsDown(evt.buttons) || this.middleButtonIsDown(evt.buttons)) && !this.drawing) {
            this.mouseDown(evt);
        }
    }
    getTouchPoint(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = evt.targetTouches[0];
        return [touch.clientX - rect.left, touch.clientY - rect.top];
    }
    touchStart(evt) {
        if (this.drawing)
            return;
        evt.preventDefault();
        this.startStroke(this.getTouchPoint(evt));
    }
    touchMove(evt) {
        if (!this.drawing)
            return;
        this.continueStroke(this.getTouchPoint(evt));
    }
    touchEnd() {
        this.drawing = false;
    }
    saveCanvas() {
        var dataURL = this.canvas.toDataURL("image/png");
        var prompt = this.container.closest(".prompt");
        if (!prompt)
            return;
        var prompt_id = prompt.id.substring(6);
        this.canvas.toBlob((blob) => {
            if (!blob) {
                console.error("Failed to create blob from canvas.");
                return;
            }
            const data = new FormData();
            data.append("data_url", blob);
            data.append("prompt_id", prompt_id);
            var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            var url = isLocal ? 'http://localhost:8000/save_promptcanvas' : 'https://www.ecocircuitai.com/save_promptcanvas';
            fetch(url, {
                method: 'POST',
                body: data,
                keepalive: true
            })
                .then(response => response.json())
                .then(result => {
            })
                .catch(error => {
                console.error("Error saving canvas using fetch with Blob:", error);
            });
        }, 'image/png');
    }
    loadCanvas() {
        var prompt = this.container.closest(".prompt");
        if (!prompt)
            return;
        var prompt_id = prompt.id.substring(6);
        fetch('/load_promptcanvas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "prompt_id": prompt_id })
        })
            .then(response => response.json())
            .then(data => this.processCanvasUrl(data.data_url))
            .catch(error => {
            console.error("Error loading canvas:", error);
        });
    }
    processCanvasUrl(dataURL) {
        if (dataURL) {
            const img = new Image();
            img.onload = () => {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.drawImage(img, 0, 0);
            };
            img.src = dataURL;
        }
    }
    saveAllCanvases() {
        PromptCanvasDraw.promptDrawInstances.forEach(instance => instance.saveCanvas());
    }
}
PromptCanvasDraw.promptDrawInstances = [];
