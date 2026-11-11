/**
 * Video Frame Studio: Application Logic
 * Offline-capable browser tool for capturing precision frames and thumbnails.
 */

(function () {
  "use strict";

  // Elements
  const video = document.querySelector("#video");
  const stageEmpty = document.querySelector("#stageEmpty");
  const videoStage = document.querySelector("#videoStage");
  const canvas = document.querySelector("#canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const fileInput = document.querySelector("#videofile");
  const urlInput = document.querySelector("#videourl");
  const loadUrlBtn = document.querySelector("#loadUrlBtn");
  const dropzone = document.querySelector("#source-file-panel");
  const tabFile = document.querySelector("#tabFile");
  const tabUrl = document.querySelector("#tabUrl");
  const sourceUrlPanel = document.querySelector("#source-url-panel");

  // Timeline & Transport
  const slider = document.querySelector("#slider");
  const currentTimeReadout = document.querySelector("#currentTimeReadout");
  const durationReadout = document.querySelector("#durationReadout");
  const videoMetaBadge = document.querySelector("#videoMetaBadge");
  const metaRes = document.querySelector("#metaRes");
  const videoInfo = document.querySelector("#videoInfo");
  const infoRes = document.querySelector("#infoRes");
  const infoDuration = document.querySelector("#infoDuration");
  const infoPos = document.querySelector("#infoPos");
  const infoAspect = document.querySelector("#infoAspect");

  const btnStart = document.querySelector("#btnStart");
  const btnMin1m = document.querySelector("#btnMin1m");
  const btnMin5s = document.querySelector("#btnMin5s");
  const btnMin1s = document.querySelector("#btnMin1s");
  const btnMinFrame = document.querySelector("#btnMinFrame");
  const btnPlayPause = document.querySelector("#btnPlayPause");
  const playIcon = document.querySelector("#playIcon");
  const pauseIcon = document.querySelector("#pauseIcon");
  const playLabel = document.querySelector("#playLabel");
  const btnPlusFrame = document.querySelector("#btnPlusFrame");
  const btnPlus1s = document.querySelector("#btnPlus1s");
  const btnPlus5s = document.querySelector("#btnPlus5s");
  const btnPlus1m = document.querySelector("#btnPlus1m");
  const btnEnd = document.querySelector("#btnEnd");

  // Snapshot studio
  const videow = document.querySelector("#videow");
  const snapd = document.querySelector("#snapd");
  const snapEach = document.querySelector("#snap_each");
  const snapBtn = document.querySelector("#snap");
  const snap2Btn = document.querySelector("#snap2");
  const snap2Label = document.querySelector("#snap2Label");
  const saveBtn = document.querySelector("#save");
  const saveallBtn = document.querySelector("#saveall");
  const clearBtn = document.querySelector("#clear");
  const snapsize = document.querySelector("#snapsize");
  const outputs = document.querySelector("#outputs");
  const galleryEmpty = document.querySelector("#galleryEmpty");
  const previewCard = document.querySelector("#previewCard");
  const previewImg = document.querySelector("#preview");
  const previewTimecode = document.querySelector("#previewTimecode");
  const previewDownloadBtn = document.querySelector("#previewDownloadBtn");
  const imagelink = document.querySelector("#imagelink");

  // Theme & Modal
  const themeToggle = document.querySelector("#themeToggle");
  const themeLabel = document.querySelector("#themeLabel");
  const shortcutsBtn = document.querySelector("#shortcutsBtn");
  const shortcutsModal = document.querySelector("#shortcutsModal");
  const closeShortcutsBtn = document.querySelector("#closeShortcutsBtn");

  // Internal state
  let snapProc = null;
  let isAutoSnapping = false;
  let activeObjectURL = null;
  let selectedImgElement = null;
  let currentVideoFilename = "video";

  // Helper: Format seconds to MM:SS.cc or HH:MM:SS.cc
  function formatTimecode(sec) {
    if (isNaN(sec) || sec < 0) sec = 0;
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    const centis = Math.floor((sec % 1) * 100);

    const pad = (n, w = 2) => String(n).padStart(w, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  }

  // Update timecode displays
  function updateTimeDisplay() {
    if (!video.duration) return;
    slider.value = video.currentTime;
    currentTimeReadout.textContent = formatTimecode(video.currentTime);
    infoPos.textContent = `${video.currentTime.toFixed(2)}s`;
  }

  function seekToTime(time) {
    if (!video.duration) return;
    video.currentTime = Math.min(video.duration, Math.max(0, time));
    updateTimeDisplay();
  }

  // Calculate snap dimensions based on videow and video aspect ratio
  function getSnapDimensions() {
    const naturalWidth = video.videoWidth || 640;
    const naturalHeight = video.videoHeight || 360;
    const ratio = naturalWidth / naturalHeight;
    const targetWidth = parseInt(videow.value, 10) || naturalWidth;
    const targetHeight = Math.max(1, Math.round(targetWidth / ratio));
    return { w: targetWidth, h: targetHeight };
  }

  // Enable/disable transport and snap buttons
  function setControlsEnabled(enabled) {
    slider.disabled = !enabled;
    btnStart.disabled = !enabled;
    btnMin1m.disabled = !enabled;
    btnMin5s.disabled = !enabled;
    btnMin1s.disabled = !enabled;
    btnMinFrame.disabled = !enabled;
    btnPlayPause.disabled = !enabled;
    btnPlusFrame.disabled = !enabled;
    btnPlus1s.disabled = !enabled;
    btnPlus5s.disabled = !enabled;
    btnPlus1m.disabled = !enabled;
    btnEnd.disabled = !enabled;
    snapBtn.disabled = !enabled;
    snap2Btn.disabled = !enabled;
  }

  // Update gallery action buttons (Save, Save All, Clear)
  function updateGalleryState() {
    const totalFrames = outputs.querySelectorAll(".output-item").length;
    snapsize.textContent = `${totalFrames} ${totalFrames === 1 ? "frame" : "frames"} captured`;

    if (totalFrames === 0) {
      galleryEmpty.classList.remove("hidden");
      saveBtn.disabled = true;
      saveallBtn.disabled = true;
      clearBtn.disabled = true;
      previewCard.classList.add("hidden");
      selectedImgElement = null;
    } else {
      galleryEmpty.classList.add("hidden");
      saveBtn.disabled = !selectedImgElement;
      saveallBtn.disabled = false;
      clearBtn.disabled = false;
    }
  }

  // Video metadata loaded
  video.addEventListener("loadedmetadata", function () {
    stageEmpty.classList.add("hidden");
    video.classList.remove("hidden");
    slider.max = video.duration;
    slider.value = 0;
    durationReadout.textContent = formatTimecode(video.duration);
    currentTimeReadout.textContent = formatTimecode(0);

    const w = video.videoWidth;
    const h = video.videoHeight;
    videow.value = w;

    // Display metadata
    videoMetaBadge.classList.remove("hidden");
    metaRes.textContent = `${w} × ${h}`;
    videoInfo.classList.remove("hidden");
    infoRes.textContent = `${w} × ${h} px`;
    infoDuration.textContent = `${video.duration.toFixed(2)}s`;
    infoPos.textContent = "0.00s";
    infoAspect.textContent = `${(w / h).toFixed(2)}:1`;

    setControlsEnabled(true);
  });

  // Time update listener
  video.addEventListener("timeupdate", updateTimeDisplay);

  // Play / Pause state handling
  video.addEventListener("play", function () {
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
    playLabel.textContent = "Pause";
  });

  video.addEventListener("pause", function () {
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    playLabel.textContent = "Play";
  });

  // Transport button events
  btnPlayPause.addEventListener("click", function () {
    if (!video.duration) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  slider.addEventListener("input", function () {
    if (!video.duration) return;
    video.currentTime = parseFloat(slider.value);
    currentTimeReadout.textContent = formatTimecode(video.currentTime);
  });

  btnStart.addEventListener("click", () => seekToTime(0));
  btnMin1m.addEventListener("click", () => seekToTime(video.currentTime - 60));
  btnMin5s.addEventListener("click", () => seekToTime(video.currentTime - 5));
  btnMin1s.addEventListener("click", () => seekToTime(video.currentTime - 1));
  btnMinFrame.addEventListener("click", () => seekToTime(video.currentTime - (1 / 25)));
  btnPlusFrame.addEventListener("click", () => seekToTime(video.currentTime + (1 / 25)));
  btnPlus1s.addEventListener("click", () => seekToTime(video.currentTime + 1));
  btnPlus5s.addEventListener("click", () => seekToTime(video.currentTime + 5));
  btnPlus1m.addEventListener("click", () => seekToTime(video.currentTime + 60));
  btnEnd.addEventListener("click", () => seekToTime(video.duration));

  // Source selection tabs
  tabFile.addEventListener("click", function () {
    tabFile.classList.add("active");
    tabFile.setAttribute("aria-selected", "true");
    tabUrl.classList.remove("active");
    tabUrl.setAttribute("aria-selected", "false");
    dropzone.classList.remove("hidden");
    sourceUrlPanel.classList.add("hidden");
  });

  tabUrl.addEventListener("click", function () {
    tabUrl.classList.add("active");
    tabUrl.setAttribute("aria-selected", "true");
    tabFile.classList.remove("active");
    tabFile.setAttribute("aria-selected", "false");
    sourceUrlPanel.classList.remove("hidden");
    dropzone.classList.add("hidden");
  });

  // Load video from File
  function loadFile(file) {
    if (!file) return;
    if (activeObjectURL) {
      URL.revokeObjectURL(activeObjectURL);
    }
    currentVideoFilename = file.name.replace(/\.[^/.]+$/, "");
    activeObjectURL = URL.createObjectURL(file);
    video.src = activeObjectURL;
    video.load();
  }

  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) {
      loadFile(fileInput.files[0]);
    }
  });

  // Drag and Drop handling
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  videoStage.addEventListener("dragover", function (e) {
    e.preventDefault();
  });

  videoStage.addEventListener("drop", function (e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  // Load video from direct URL
  loadUrlBtn.addEventListener("click", function () {
    const url = urlInput.value.trim();
    if (!url) return;
    if (activeObjectURL) {
      URL.revokeObjectURL(activeObjectURL);
      activeObjectURL = null;
    }
    currentVideoFilename = "url-video";
    video.crossOrigin = "anonymous";
    video.src = url;
    video.load();
  });

  // Single Frame Capture
  function snapPicture() {
    if (!video.videoWidth) return;
    const { w, h } = getSnapDimensions();
    canvas.width = w;
    canvas.height = h;
    context.drawImage(video, 0, 0, w, h);

    const time = video.currentTime;
    const dataURL = canvas.toDataURL("image/png");

    const item = document.createElement("div");
    item.className = "output-item";

    const img = document.createElement("img");
    img.src = dataURL;
    img.className = "output-img";
    img.alt = `Frame at ${formatTimecode(time)}`;
    img.dataset.time = time.toFixed(2);
    img.dataset.resolution = `${w}x${h}`;

    const badge = document.createElement("span");
    badge.className = "output-badge";
    badge.textContent = `${formatTimecode(time)} (${w}×${h})`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "output-remove-btn";
    removeBtn.type = "button";
    removeBtn.title = "Delete snapshot";
    removeBtn.setAttribute("aria-label", "Delete snapshot");
    removeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      item.remove();
      if (selectedImgElement === img) {
        selectedImgElement = null;
        previewCard.classList.add("hidden");
      }
      updateGalleryState();
    });

    item.appendChild(img);
    item.appendChild(badge);
    item.appendChild(removeBtn);

    item.addEventListener("click", function () {
      selectImage(img, item);
      seekToTime(time);
    });

    outputs.appendChild(item);
    selectImage(img, item);
    updateGalleryState();
  }

  // Select image for inspection
  function selectImage(img, item) {
    outputs.querySelectorAll(".output-item").forEach(el => el.classList.remove("selected"));
    item.classList.add("selected");
    selectedImgElement = img;

    previewImg.src = img.src;
    previewTimecode.textContent = `Frame at ${formatTimecode(parseFloat(img.dataset.time))} (${img.dataset.resolution})`;
    previewCard.classList.remove("hidden");
    saveBtn.disabled = false;
  }

  snapBtn.addEventListener("click", snapPicture);

  // Stop auto snap procedure
  function stopAutoSnap() {
    if (snapProc) {
      clearInterval(snapProc);
      snapProc = null;
    }
    isAutoSnapping = false;
    snap2Label.textContent = "Auto Snap All";
    snap2Btn.classList.remove("btn-primary");
    snap2Btn.classList.add("btn-secondary");
  }

  // Auto snap calculation
  function runAutoSnap() {
    if (!video.duration) {
      alert("Please load a video first.");
      return;
    }

    if (isAutoSnapping) {
      stopAutoSnap();
      return;
    }

    isAutoSnapping = true;
    snap2Label.textContent = "Stop Auto Snap";
    snap2Btn.classList.remove("btn-secondary");
    snap2Btn.classList.add("btn-primary");

    const sel = snapEach.value;
    let intervalSec = 1;
    const duration = video.duration;

    if (sel.includes("%")) {
      const pct = parseFloat(sel.replace("%", "")) / 100;
      intervalSec = duration * pct;
    } else if (sel.includes("m")) {
      intervalSec = parseFloat(sel.replace("m", "")) * 60;
    }

    intervalSec = Math.max(0.1, intervalSec);
    const delay = Math.max(50, parseInt(snapd.value, 10) || 300);

    let currentTime = 0.05;
    video.pause();

    snapProc = setInterval(function () {
      if (currentTime >= duration || !isAutoSnapping) {
        stopAutoSnap();
        return;
      }
      seekToTime(currentTime);
      setTimeout(snapPicture, Math.min(200, delay / 2));
      currentTime += intervalSec;
    }, delay + 120);
  }

  snap2Btn.addEventListener("click", runAutoSnap);

  // Download single image
  function downloadImage(dataURL, filename) {
    imagelink.href = dataURL;
    imagelink.download = filename;
    imagelink.click();
  }

  saveBtn.addEventListener("click", function () {
    if (!selectedImgElement) return;
    const t = selectedImgElement.dataset.time || "0";
    const filename = `${currentVideoFilename}-frame-${t}s.png`;
    downloadImage(selectedImgElement.src, filename);
  });

  previewDownloadBtn.addEventListener("click", function () {
    if (!selectedImgElement) return;
    const t = selectedImgElement.dataset.time || "0";
    const filename = `${currentVideoFilename}-frame-${t}s.png`;
    downloadImage(selectedImgElement.src, filename);
  });

  // Save All Images to ZIP (using local JSZip and FileSaver)
  function zipAllImages() {
    const images = outputs.querySelectorAll(".output-img");
    if (images.length === 0) return;

    saveallBtn.disabled = true;
    const originalText = saveallBtn.textContent;
    saveallBtn.textContent = "Creating ZIP...";

    const zip = new JSZip();
    const folder = zip.folder("video-frames");

    images.forEach(function (img, idx) {
      const timeStr = String(img.dataset.time).padStart(6, "0");
      const base64Data = img.src.replace(/^data:image\/png;base64,/, "");
      const fname = `frame-${idx + 1}-t${timeStr}s.png`;
      folder.file(fname, base64Data, { base64: true });
    });

    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        saveAs(content, `${currentVideoFilename}-frames.zip`);
        saveallBtn.disabled = false;
        saveallBtn.textContent = originalText;
      })
      .catch(function (err) {
        console.error("ZIP creation failed:", err);
        alert("Failed to build ZIP file.");
        saveallBtn.disabled = false;
        saveallBtn.textContent = originalText;
      });
  }

  saveallBtn.addEventListener("click", zipAllImages);

  // Clear all snapshots
  clearBtn.addEventListener("click", function () {
    stopAutoSnap();
    outputs.innerHTML = "";
    updateGalleryState();
  });

  // Theme Switcher (Dark Studio / Light Studio)
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vfs-theme", theme);
    if (theme === "light") {
      themeLabel.textContent = "Dark Mode";
    } else {
      themeLabel.textContent = "Light Mode";
    }
  }

  const savedTheme = localStorage.getItem("vfs-theme") || "dark";
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  });

  // Shortcuts Modal
  shortcutsBtn.addEventListener("click", function () {
    shortcutsModal.classList.remove("hidden");
  });

  closeShortcutsBtn.addEventListener("click", function () {
    shortcutsModal.classList.add("hidden");
  });

  shortcutsModal.addEventListener("click", function (e) {
    if (e.target === shortcutsModal) {
      shortcutsModal.classList.add("hidden");
    }
  });

  // Global Keyboard Navigation
  window.addEventListener("keydown", function (e) {
    // If typing in input, ignore global shortcuts
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    if (e.key === "Escape") {
      shortcutsModal.classList.add("hidden");
      if (isAutoSnapping) stopAutoSnap();
      return;
    }

    if (!video.duration) return;

    if (e.code === "Space") {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      seekToTime(video.currentTime - step);
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      seekToTime(video.currentTime + step);
    } else if (e.key === "[") {
      e.preventDefault();
      seekToTime(video.currentTime - (1 / 25));
    } else if (e.key === "]") {
      e.preventDefault();
      seekToTime(video.currentTime + (1 / 25));
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      snapPicture();
    } else if (e.key === "z" || e.key === "Z") {
      e.preventDefault();
      if (!saveallBtn.disabled) zipAllImages();
    }
  });

})();
