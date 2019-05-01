import './polyfills'

import './style.css'

import io from 'socket.io-client'
import QRCode from 'qrcode'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'

import { enableFullscreenToggle, slashJoin } from './utils'
import Zoomer from './zoomer'

enableFullscreenToggle();

const parameters = new URLSearchParams(window.location.search);
const namespace = parameters.get('namespace') || 'default';

fetch(`/photowall/${namespace}`)
    .then(resp => resp.json())
    .then(json => startup({ ...json, namespace }));

function startup({ namespace, files, imageLimit = 200 }) {
    const $noPics = document.querySelector('.no-pics');
    const $photos = document.getElementById("photos");

    const zoomer = new Zoomer($photos);

    if (files.length) {
        for (const file of files) {
            $photos.appendChild(createPhoto(file))
        }
    } else {
        $noPics.classList.remove('hide');
    }

    function createPhoto(filename) {
        const $newImage = document.createElement('img');
        $newImage.setAttribute("src", filename);
        $newImage.classList.add('photo');
        return $newImage;
    }

    imagesLoaded($photos, () => {
        const masonry = new Masonry($photos, {
            itemSelector: '.photo',
            columnWidth: '.photo-sizer',
            percentPosition: true
        });

        function removeOldPhotos() {
            const oldPics = Array.from($photos.querySelectorAll('img.photo')).slice(imageLimit);

            if (oldPics.length) {
                oldPics.forEach(item => masonry.remove(item));
            }
        }

        masonry.on('layoutComplete', () => zoomer.retarget());

        const socket = io(`/photowall?room=${namespace}`);

        socket.on('new_file', (filename) => {
            $noPics && $noPics.remove();

            const $newImage = createPhoto(filename);
            $photos.insertBefore($newImage, $photos.firstChild);

            removeOldPhotos();

            $newImage.onload = () => {
                masonry.prepended($newImage);
            };
        });

        zoomer.start();
    });

    const $qrCode = document.querySelector('#qr-code canvas');
    const url = `${window.location.origin}/upload.html?namespace=${namespace}`;
    QRCode.toCanvas($qrCode, url, { margin: 0 });
}
