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
    const $progress = document.getElementById('progress');

    const resizeConfig = {
        quality: 0.90,
        maxWidth: 1920,
        maxHeight: 1080,
        autoRotate: true
    };

    function showEl($el) {
        if ($el.classList.contains('d-none')) {
            $el.classList.remove('d-none');
        }
    }

    function hideEl($el) {
        if (!$el.classList.contains('d-none')) {
            $el.classList.add('d-none');
        }
    }

    function clearState() {
        hideEl($successAlert);
        hideEl($errorAlert);
        hideEl($progress);
    }

    function showSuccess() {
        hideEl($progress)
        hideEl($errorAlert)
        showEl($successAlert);
    }

    function showError(msg) {
        hideEl($progress);
        hideEl($successAlert);
        showEl($errorAlert);
        $errorAlert.innerText = msg;
    }

    function showProgress() {
        showEl($progress);
    }

    $inputField.addEventListener('change', e => {
        clearState();

        const inputFiles = Array.from(e.target.files);

        showProgress();

        Promise.all(
            inputFiles.map(file =>
                file.type === 'image/jpeg' ?
                    readAndCompressImage(file, resizeConfig).then(blob => {
                        blob.name = file.name;
                        return blob;
                    })
                    : file
            )
        ).then(resizedFiles =>
            uploadFiles(resizedFiles))
        .then(() => {
            showSuccess();
        }).catch((err) => {
            showError("Unable to upload photo.");
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

        return fetch(`/photowall/${namespace}/upload`, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response;
        });
    }
} else {
    alert("File upload is not supported!");
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('file-input').click();
}, false);