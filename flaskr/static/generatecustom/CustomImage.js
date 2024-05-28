export class CustomImage {
    constructor(imgurl, container, posX = 22.5 * 16, posY = 0, transform = "translate(0,0)", width = 45 * 16, height = 45 * 16) {
        this.imgurl = imgurl;
        this.transform = transform;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.container = container;
        this.init();
    }
    init() {
        let customImage = document.createElement('div');
        customImage.classList.add('customImage');
        customImage.style.top = this.posY + 'px';
        customImage.style.left = this.posX + 'px';
        customImage.style.width = this.width + 'px';
        customImage.style.height = this.height + 'px';
        customImage.style.borderRadius = '0.5rem';
        let img = document.createElement('img');
        img.src = this.imgurl;
        img.classList.add('image');
        customImage.appendChild(img);
        this.container.appendChild(customImage);
    }
    getImgurl() {
        return this.imgurl;
    }
    setImgurl(imgurl) {
        this.imgurl = imgurl;
    }
    getTransform() {
        return this.transform;
    }
    setTransform(transform) {
        this.transform = transform;
    }
    getPosX() {
        return this.posX;
    }
    setPosX(posX) {
        this.posX = posX;
    }
    getPosY() {
        return this.posY;
    }
    setPosY(posY) {
        this.posY = posY;
    }
    getWidth() {
        return this.width;
    }
    setWidth(width) {
        this.width = width;
    }
    getHeight() {
        return this.height;
    }
    setHeight(height) {
        this.height = height;
    }
    getContainer() {
        return this.container;
    }
    setContainer(container) {
        this.container = container;
    }
    toJSONObj() {
        return { [this.imgurl]: [[this.posX, this.posY], [this.width, this.height], this.transform] };
    }
}
