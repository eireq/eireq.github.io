import { onMounted, onUnmounted, reactive, ref, watch } from "vue";

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

// old safari only has the webkit versions, and those don't return a promise
async function requestFullscreen(node) {
  const request = node.requestFullscreen || node.webkitRequestFullscreen;
  if (!request) throw new Error("unavailable");
  await request.call(node);
}

function exitFullscreen(node) {
  if (fullscreenElement() !== node) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  Promise.resolve(exit?.call(document)).catch(() => {});
}

// real fullscreen when the browser allows it. iphones don't, so there the
// board just fills the window with css instead (cssOnly)
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
