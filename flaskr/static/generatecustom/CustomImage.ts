// <div class="customImage" id="customImage"
// style="left: 22.5rem; top: 0; position: absolute; width: 45rem; height: 45rem; border-radius: 0.5rem;">
// <img src="{{customproject['img_url']}}" class="image">
// </div>

export class CustomImage {
    //constructed by  {“imgurl”:[[pos_array(num)], [size_array(num)], transform]}
    imgurl: string;
    transform: string;
    posX: number;
    posY: number;
    width: number; //45rem
    height: number; //45rem
    container: HTMLElement;

    constructor(imgurl: string, container: HTMLElement, posX: number = 22.5 * 16, posY: number = 0, transform: string = "translate(0,0)", width: number = 45 * 16, height: number = 45 * 16) {
        //all default values *16 because we need to convert rem to px
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

    //getters and setters
    getImgurl() {
        return this.imgurl;
    }

    setImgurl(imgurl: string) {
        this.imgurl = imgurl;
    }

    getTransform() {
        return this.transform;
    }

    setTransform(transform: string) {
        this.transform = transform;
    }

    getPosX() {
        return this.posX;
    }

    setPosX(posX: number) {
        this.posX = posX;
    }

    getPosY() {
        return this.posY;
    }

    setPosY(posY: number) {
        this.posY = posY;
    }

    getWidth() {
        return this.width;
    }

    setWidth(width: number) {
        this.width = width;
    }

    getHeight() {
        return this.height;
    }

    setHeight(height: number) {
        this.height = height;
    }

    getContainer() {
        return this.container;
    }

    setContainer(container: HTMLElement) {
        this.container = container;
    }

    //methods
    toJSONObj() {
        //return {“imgurl”:[[pos_array(num)], [size_array(num)], transform]}
        return { [this.imgurl]: [[this.posX, this.posY], [this.width, this.height], this.transform] };
    }



}