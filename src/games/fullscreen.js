import { onMounted, onUnmounted, reactive, ref, watch } from "vue";

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreen(node) {
  const request = node.requestFullscreen || node.webkitRequestFullscreen;
  if (!request) return Promise.reject(new Error("unavailable"));
  try {
    const pending = request.call(node);
    return pending && typeof pending.then === "function" ? pending : Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

function exitFullscreen(node) {
  if (fullscreenElement() !== node) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  const pending = exit?.call(document);
  if (pending && typeof pending.catch === "function") pending.catch(() => {});
}

export function useFullscreen(target) {
  const active = ref(false);
  let cssOnly = false;
  let requestId = 0;

  function sync() {
    const node = target.value;
    if (node && fullscreenElement() === node) {
      cssOnly = false;
      active.value = true;
      return;
    }
    if (!cssOnly) active.value = false;
  }

  function toggle() {
    const node = target.value;
    if (!node) return;
    if (active.value) {
      cssOnly = false;
      active.value = false;
      requestId += 1;
      exitFullscreen(node);
      return;
    }
    const id = ++requestId;
    requestFullscreen(node).then(
      () => {
        if (id !== requestId || fullscreenElement() !== node) return;
        cssOnly = false;
        active.value = true;
      },
      () => {
        if (id !== requestId) return;
        cssOnly = true;
        active.value = true;
      },
    );
  }

  watch(active, (on) => {
    document.documentElement.classList.toggle("game-screen", on);
  });

  onMounted(() => {
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
  });

  onUnmounted(() => {
    document.removeEventListener("fullscreenchange", sync);
    document.removeEventListener("webkitfullscreenchange", sync);
    cssOnly = false;
    requestId += 1;
    active.value = false;
    document.documentElement.classList.remove("game-screen");
    if (target.value) exitFullscreen(target.value);
  });

  return reactive({ active, toggle });
}
