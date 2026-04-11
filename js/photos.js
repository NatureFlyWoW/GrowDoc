// GrowDoc Companion — Photo Journal
//
// CRITICAL DESIGN: photos are stored in a SEPARATE localStorage key
// (growdoc-photos-v1), NOT inside the grow state. Storing base64
// data inside grow.plants[i].logs[i].photo would cause every read
// of store.state.grow to deserialize all photo bytes, creating
// catastrophic input lag on mobile.
//
// Log entries reference photos by ID only (log.photoId = 'photo-xyz').
// loadPhoto() lazily reads from the photos key only when the gallery
// or expanded log entry needs to display them.

import { generateId } from './utils.js';

const PHOTOS_KEY = 'growdoc-photos-v1';

// Photo budget: ~1.5MB safe budget for ~10-13 compressed photos.
// Other GrowDoc data uses ~2-3MB realistic, leaving 1.5-2MB for photos
// under the 5MB browser localStorage cap.
const PHOTO_BUDGET_BYTES = 1_500_000;

// Compression target
const TARGET_WIDTH = 800;
const JPEG_QUALITY = 0.75;

/**
 * Read all photos from the dedicated key.
 * Returns an object { photoId: dataUrl }.
 */
function _readPhotos() {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Write the full photos dict back to the key.
 * Wraps in try/catch for QuotaExceededError handling.
 */
function _writePhotos(photos) {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      throw new Error('Storage full. Export your photos first or delete old ones from Settings.');
    }
    throw err;
  }
}

/**
 * Capture a still frame from a video element (or any drawable source)
 * via canvas, scale to TARGET_WIDTH, encode as JPEG at JPEG_QUALITY.
 *
 * @param {HTMLVideoElement|HTMLImageElement} source - Drawable image source
 * @returns {string} data URL beginning 'data:image/jpeg;base64,'
 */
export function capturePhoto(source) {
  if (!source) throw new Error('capturePhoto requires a video or image source');
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error('Source has no dimensions yet');
  }

  const aspect = sourceHeight / sourceWidth;
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = Math.round(TARGET_WIDTH * aspect);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/**
 * Save a captured photo to the photos key. Generates a unique ID,
 * checks quota first, throws if at the budget cap.
 *
 * @param {string} dataUrl - JPEG data URL
 * @returns {string} photoId
 */
export function savePhoto(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    throw new Error('Invalid photo data URL');
  }

  const quota = checkPhotoQuota();
  if (quota.level === 'full') {
    throw new Error('Storage full. Export your photos first or delete old ones from Settings.');
  }

  const photos = _readPhotos();
  const photoId = `photo-${generateId()}`;
  photos[photoId] = dataUrl;
  _writePhotos(photos);
  return photoId;
}

/**
 * Lazy-load a single photo by ID.
 * @param {string} photoId
 * @returns {string|null} data URL or null if not found
 */
export function loadPhoto(photoId) {
  if (!photoId) return null;
  const photos = _readPhotos();
  return photos[photoId] || null;
}

/**
 * Delete a photo by ID. Returns true if it existed.
 */
export function deletePhoto(photoId) {
  if (!photoId) return false;
  const photos = _readPhotos();
  if (!(photoId in photos)) return false;
  delete photos[photoId];
  _writePhotos(photos);
  return true;
}

/**
 * List all photo IDs currently stored.
 */
export function listPhotoIds() {
  return Object.keys(_readPhotos());
}

/**
 * Compute photo storage usage and status against PHOTO_BUDGET_BYTES.
 * @returns {{used: number, budget: number, percent: number, count: number, level: 'ok'|'warning'|'full'}}
 */
export function checkPhotoQuota() {
  let used = 0;
  let count = 0;
  try {
    const raw = localStorage.getItem(PHOTOS_KEY);
    if (raw) {
      // Approximate UTF-16 byte count
      used = raw.length * 2;
      const parsed = JSON.parse(raw);
      count = Object.keys(parsed).length;
    }
  } catch {
    // ignore
  }
  const percent = used / PHOTO_BUDGET_BYTES;
  let level = 'ok';
  if (percent >= 1.0) level = 'full';
  else if (percent >= 0.8) level = 'warning';
  return {
    used,
    budget: PHOTO_BUDGET_BYTES,
    percent: Math.round(percent * 100),
    count,
    level,
  };
}

/**
 * Open a camera modal, let the user capture, save, and resolve with photoId.
 * Falls back to a file input if getUserMedia throws (permission denied,
 * no camera, http origin).
 *
 * @returns {Promise<string|null>} photoId on success, null on cancel
 */
export async function openCameraModal() {
  return new Promise(async (resolve) => {
    const overlay = _buildModalOverlay();
    const dialog = document.createElement('div');
    dialog.style.background = 'var(--bg-elevated, #fff)';
    dialog.style.padding = '16px';
    dialog.style.borderRadius = '8px';
    dialog.style.maxWidth = '600px';
    dialog.style.width = 'calc(100vw - 32px)';
    dialog.style.maxHeight = 'calc(100vh - 64px)';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.gap = '12px';
    overlay.appendChild(dialog);

    const title = document.createElement('h3');
    title.textContent = 'Take a photo';
    title.style.margin = '0';
    dialog.appendChild(title);

    let stream = null;
    let cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.maxHeight = '60vh';
      video.style.background = '#000';
      video.style.borderRadius = '4px';
      video.srcObject = stream;
      dialog.appendChild(video);

      const captureBtn = document.createElement('button');
      captureBtn.className = 'btn btn-primary';
      captureBtn.textContent = '📸 Capture';
      captureBtn.addEventListener('click', () => {
        try {
          const dataUrl = capturePhoto(video);
          const photoId = savePhoto(dataUrl);
          cleanup();
          resolve(photoId);
        } catch (err) {
          alert(err.message || 'Photo capture failed');
        }
      });

      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '8px';
      btnRow.appendChild(captureBtn);
      btnRow.appendChild(cancelBtn);
      dialog.appendChild(btnRow);
    } catch (err) {
      // Fallback: file upload input (camera permission denied,
      // no camera, http origin, etc.)
      const note = document.createElement('p');
      note.className = 'text-muted';
      note.textContent = `Camera unavailable (${err.name || 'error'}). Upload a photo instead:`;
      dialog.appendChild(note);

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.capture = 'environment';
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
          const img = await _fileToImage(file);
          const dataUrl = capturePhoto(img);
          const photoId = savePhoto(dataUrl);
          cleanup();
          resolve(photoId);
        } catch (e) {
          alert(e.message || 'Upload failed');
        }
      });
      dialog.appendChild(fileInput);

      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '8px';
      btnRow.appendChild(cancelBtn);
      dialog.appendChild(btnRow);
    }

    document.body.appendChild(overlay);
  });
}

function _buildModalOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';
  overlay.style.padding = '16px';
  return overlay;
}

function _fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
