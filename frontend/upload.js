import './polyfills'

import 'font-awesome/css/font-awesome.css'
import '../node_modules/bootstrap/dist/css/bootstrap.css'
import './style.css'

import { readAndCompressImage } from 'browser-image-resizer';
import { extension } from "./utils";

if (window.File && window.FileReader && window.FormData) {
    const parameters = new URLSearchParams(window.location.search);
    const namespace = parameters.get('namespace') || 'default';

    const $inputField = document.getElementById('file-input');
    const $successAlert = document.getElementById('success-alert');
    const $errorAlert = document.getElementById('error-alert');

    const resizeConfig = {
        quality: 0.90,
        maxWidth: 1920,
        maxHeight: 1080,
        autoRotate: true
    };

    $inputField.addEventListener('change', e => {
        if (!$successAlert.classList.contains('d-none')) {
            $successAlert.classList.add('d-none');
        }

        if (!$errorAlert.classList.contains('d-none')) {
            $errorAlert.classList.add('d-none');
        }

        const inputFiles = Array.from(e.target.files);

        Promise.all(
            inputFiles.map(file =>
                file.type === 'image/jpeg' ?
                    readAndCompressImage(file, resizeConfig).then(blob => {
                        blob.name = file.name;
                        return blob;
                    })
                    : file
            )
        ).then(resizedFiles => {
            uploadFiles(resizedFiles);
        }).catch((err) => {
            $errorAlert.classList.remove('d-none');
            $errorAlert.innerText = err;
        });
    });

    function uploadFiles(resizedFiles) {
        const formData = new FormData();

        let fileIdx = 0;
        for (const file of resizedFiles) {
            if (file && /^image\//i.test(file.type)) {
                const ext = extension(file.name);
                formData.append(`upload-${fileIdx++}${ext}`, file);
            }
        }

        fetch(`/photowall/${namespace}/upload`, {
            method: 'POST',
            body: formData
        }).then(() => {
            $successAlert.classList.remove('d-none');
        }).catch((err) => {
            $errorAlert.classList.remove('d-none');
            $errorAlert.innerText = err;
        });
    }
} else {
    alert("File upload is not supported!");
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('file-input').click();
}, false);