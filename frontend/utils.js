export function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

export function enableFullscreenToggle() {
    document.body.addEventListener('click', () => toggleFullScreen());
}

export const shuffle = (arr) => {
    let copy = [...arr];
    let m = copy.length, i;
    while (m) {
        i = (Math.random() * m--) >>> 0;
        [copy[m], copy[i]] = [copy[i], copy[m]]
    }
    return copy;
};

export function extension(filename) {
    const index = filename.lastIndexOf('.');
    return index !== -1 ? filename.substring(index) : '';
}
