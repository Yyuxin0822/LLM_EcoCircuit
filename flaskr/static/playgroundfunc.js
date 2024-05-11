class PlaygroundFuncBar{
    constructor(container) {
        this.container = container;
        this.selButton = this.container.getElementById("selmode");

        this.marqueeToolInstance = null;
        this.attachEventListeners();
    }
}