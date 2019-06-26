import {shuffle} from "./utils";

const PANNING = 1;
const WAITING = 2;

export default class Zoomer {

    constructor(container) {
        this.container = container;

        this.animationRunning = null;

        this.waitDuration = 5000;
        this.panDuration = 2000;

        this.container.style.transition = `all ${this.panDuration}ms ease-in-out`;
    }

    _findTargets() {
        let elements = Array.from(this.container.querySelectorAll('img'));

        if (elements.length === 0) return [];

        return [elements[0], ...shuffle(elements.slice(1))].map(item => ({
            cx: item.offsetLeft + (item.offsetWidth / 2),
            cy: item.offsetTop + (item.offsetHeight / 2),
            w: item.offsetWidth,
            h: item.offsetHeight
        }));
    }

    retarget() {
        this.targets = this._findTargets();
        if (this.targets.length) {
            this.panTo(0);
        }
    }

    start() {
        this.targetX = 0;
        this.targetY = 0;
        this.currentZoom = 2.0;
        this.retarget();

        this._zoomToPhoto();
        this.animationRunning = setInterval(this._zoomToPhoto.bind(this), this.panDuration + this.waitDuration);
    }

    _zoomToPhoto() {
        if (this.targets.length) {

            this.targetX = this.panStartX + this.panDirectionVector.x;
            this.targetY = this.panStartY + this.panDirectionVector.y;
            this.currentZoom = this.panStartZoom + this.panZoomIncrement;

            const transformX = ((document.body.offsetWidth / 2) - this.targetX * this.currentZoom);
            const transformY = ((document.body.offsetHeight / 2) - this.targetY * this.currentZoom);

            this.container.style.transform = `translate(${transformX}px, ${transformY}px) scale(${this.currentZoom})`;

            this.panTo((this.targetIndex + 1) % this.targets.length);
        }
    }

    panTo(targetIndex) {
        this.targetIndex = targetIndex;

        const target = this.targets[this.targetIndex];
        const targetZoom = (document.body.offsetHeight / target.h) * 0.8;

        this.panStartX = this.targetX;
        this.panStartY = this.targetY;
        this.panStartZoom = this.currentZoom;

        this.panDirectionVector = {
            x: (target.cx - this.targetX),
            y: (target.cy - this.targetY)
        };
        this.panZoomIncrement = targetZoom - this.currentZoom;

    }

    stop() {
        this.active = false;
    }

}
