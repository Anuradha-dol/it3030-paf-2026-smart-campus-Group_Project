import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoadedPromise = null;
const REQUIRED_MODEL_MANIFESTS = [
    'tiny_face_detector_model-weights_manifest.json',
    'face_landmark_68_model-weights_manifest.json',
    'face_recognition_model-weights_manifest.json',
];

function getModelSetupErrorMessage(details = '') {
    const suffix = details ? ` ${details}` : '';
    return `Face model files are missing or invalid in client/public/models.${suffix} Add required face-api.js model manifest and shard files, then restart the frontend server.`;
}

function getDetectorOptions() {
    return new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
    });
}

async function validateModelManifests() {
    const checks = await Promise.all(
        REQUIRED_MODEL_MANIFESTS.map(async (fileName) => {
            const response = await fetch(`${MODEL_URL}/${fileName}`, { cache: 'no-store' });
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            return {
                fileName,
                ok: response.ok,
                looksLikeHtml: contentType.includes('text/html'),
            };
        })
    );

    const invalid = checks.filter((item) => !item.ok || item.looksLikeHtml);
    if (invalid.length > 0) {
        const names = invalid.map((item) => item.fileName).join(', ');
        throw new Error(getModelSetupErrorMessage(`Invalid files: ${names}.`));
    }
}

export function descriptorToArray(descriptor) {
    if (!descriptor) {
        return [];
    }
    return Array.from(descriptor);
}

export async function loadFaceModels() {
    if (!modelsLoadedPromise) {
        modelsLoadedPromise = (async () => {
            await validateModelManifests();
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
        })().catch((error) => {
            modelsLoadedPromise = null;
            const rawMessage = String(error?.message || '');
            const looksLikeHtmlError =
                rawMessage.includes("Unexpected token '<'") ||
                rawMessage.includes('is not valid JSON') ||
                rawMessage.includes('Unexpected end of JSON input');
            if (looksLikeHtmlError) {
                throw new Error(getModelSetupErrorMessage());
            }
            throw error;
        });
    }
    await modelsLoadedPromise;
}

export async function startFaceCamera(videoElement) {
    if (!videoElement) {
        throw new Error('Video element is required');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
        },
        audio: false,
    });

    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
}

export function getFaceCameraErrorMessage(error) {
    const errorName = error?.name || '';

    if (errorName === 'NotAllowedError') {
        return 'Camera permission denied. Please allow camera access in your browser settings.';
    }
    if (errorName === 'NotFoundError') {
        return 'No camera device found on this system.';
    }
    if (errorName === 'NotReadableError') {
        return 'Camera is already in use by another application.';
    }
    if (errorName === 'SecurityError') {
        return 'Camera access blocked by browser security policy.';
    }
    if (errorName === 'OverconstrainedError') {
        return 'Requested camera constraints are not supported on this device.';
    }

    return 'Unable to access camera. Please allow camera permission and try again.';
}

export function stopFaceCamera(videoElement, stream) {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
    if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
    }
}

export async function extractFaceDescriptor(videoElement) {
    if (!videoElement) {
        throw new Error('Video element is required');
    }

    await loadFaceModels();

    const detections = await faceapi
        .detectAllFaces(videoElement, getDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (!detections || detections.length === 0) {
        throw new Error('No face detected. Please center your face and try again.');
    }

    if (detections.length > 1) {
        throw new Error('Multiple faces detected. Please keep only one face in frame.');
    }

    return descriptorToArray(detections[0].descriptor);
}
