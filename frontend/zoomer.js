import { shuffle } from "./utils";

const PANNING = 1;
const WAITING = 2;

export default class Zoomer {

    constructor(container) {
        this.container = container;
        this.active = false;
        this.thisFrame = this._frame.bind(this);
        this.waitDuration = 5000;
        this.panDuration = 2000;
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
        this.active = true;

        this.currentX = 0;
        this.currentY = 0;
        this.currentZoom = 2.0;

        this.retarget();

        requestAnimationFrame(this.thisFrame);
    }

    _switchState(nextState) {
        this.state = nextState;
        this.stateBegan = performance.now();
    }

    _frame(timestamp) {
        if (this.targets.length) {
            if (this.state === PANNING) {
                const progress =  Math.min((timestamp - this.stateBegan) / this.panDuration, 1.0);

                this.currentX = this.panStartX + this.panDirectionVector.x * Math.sin(Math.PI / 2 * progress);
                this.currentY = this.panStartY + this.panDirectionVector.y * Math.sin(Math.PI / 2 * progress);
                this.currentZoom = this.panStartZoom + this.panZoomIncrement * Math.sin(Math.PI / 2 * progress);

                const transformX = ((document.body.offsetWidth / 2) - this.currentX * this.currentZoom);
                const transformY = ((document.body.offsetHeight / 2) - this.currentY * this.currentZoom);

                this.container.style.transform = `translate(${transformX}px, ${transformY}px) scale(${this.currentZoom})`;

                if (timestamp - this.stateBegan >= this.panDuration) {
                    this._switchState(WAITING);
                }
            } else if (this.state === WAITING) {
                if (timestamp - this.stateBegan >= this.waitDuration) {
                    this.panTo((this.targetIndex + 1) % this.targets.length);
                }
            }
        }

        if (this.active) {
            requestAnimationFrame(this.thisFrame);
        }
    }

    panTo(targetIndex) {
        this.targetIndex = targetIndex;

        const target = this.targets[this.targetIndex];
        const targetZoom = (document.body.offsetHeight / target.h) * 0.8;

        this.panStartX = this.currentX;
        this.panStartY = this.currentY;
        this.panStartZoom = this.currentZoom;

        this.panDirectionVector = {
            x: (target.cx - this.currentX),
            y: (target.cy - this.currentY)
        };
        this.panZoomIncrement = targetZoom - this.currentZoom;

        this._switchState(PANNING);
    }

    stop() {
        this.active = false;
    }

}