gsap.registerPlugin(ScrollTrigger);

const globe = document.getElementById("globe-wrapper");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function focusRegion(name) {
  if (window.espGlobe?.focusRegion) window.espGlobe.focusRegion(name);
}

function setTimeOfDay(mode) {
  if (window.espGlobe?.setTimeOfDay) window.espGlobe.setTimeOfDay(mode);
}

function setBodyMode(mode) {
  if (window.espGlobe?.setBodyMode) window.espGlobe.setBodyMode(mode);
}

function getApexPosition() {
  const apex = document.getElementById("pyramid-apex");
  if (!apex) return { xPercent: 0, yPercent: 0 };

  const rect = apex.getBoundingClientRect();
  return {
    xPercent: (rect.left + rect.width / 2) / window.innerWidth * 100 - 50,
    yPercent: (rect.top + rect.height / 2) / window.innerHeight * 100 - 50
  };
}

function buildPath() {
  const mobile = window.innerWidth < 860;

  return mobile
    ? [
        { id: "sec-rio", x: 52, y: -32, scale: 0.82, rotate: -6, region: "hero", time: "day" },
        { id: "sec-waf", x: -48, y: -16, scale: 0.9, rotate: -7, region: "waf", time: "golden" },
        { id: "sec-peyote", x: 48, y: 2, scale: 0.92, rotate: 8, region: "peyote", time: "night" },
        { id: "sec-toad", x: -48, y: 18, scale: 0.9, rotate: -7, region: "toad", time: "night" },
        { id: "sec-support", x: 48, y: 28, scale: 0.86, rotate: 7, region: "support", time: "sunrise" },
        { id: "sec-network", x: -48, y: 38, scale: 0.82, rotate: -5, region: "network", time: "day" }
      ]
    : [
        { id: "sec-rio", x: 72, y: -34, scale: 1.06, rotate: -7, region: "hero", time: "day" },
        { id: "sec-waf", x: -68, y: -14, scale: 1.02, rotate: -9, region: "waf", time: "golden" },
        { id: "sec-peyote", x: 68, y: 8, scale: 0.98, rotate: 10, region: "peyote", time: "night" },
        { id: "sec-toad", x: -68, y: 24, scale: 0.95, rotate: -10, region: "toad", time: "night" },
        { id: "sec-support", x: 68, y: 36, scale: 0.92, rotate: 8, region: "support", time: "sunrise" },
        { id: "sec-network", x: -68, y: 48, scale: 0.88, rotate: -7, region: "network", time: "day" }
      ];
}

function animateToStep(step, duration = 1.8) {
  gsap.to(globe, {
    xPercent: step.x,
    yPercent: step.y,
    scale: step.scale,
    rotation: step.rotate,
    duration,
    ease: "power3.inOut",
    overwrite: "auto"
  });

  focusRegion(step.region);
  setTimeOfDay(step.time);
  setBodyMode("earth");
}

function initScrollAnimation() {
  if (!globe) return;

  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.killTweensOf(globe);

  if (reduceMotion) {
    gsap.set(globe, { xPercent: 0, yPercent: 0, scale: 0.85, rotation: 0 });
    return;
  }

  const path = buildPath();

  gsap.set(globe, {
    xPercent: path[0].x,
    yPercent: path[0].y,
    scale: path[0].scale,
    rotation: path[0].rotate
  });

  path.forEach((step) => {
    ScrollTrigger.create({
      trigger: `#${step.id}`,
      start: "top 52%",
      end: "bottom 48%",
      onEnter: () => animateToStep(step),
      onEnterBack: () => animateToStep(step, 1.3)
    });
  });

  ScrollTrigger.create({
    trigger: "#site-footer",
    start: "top 62%",
    onEnter: () => {
      const apex = getApexPosition();
      setBodyMode("moon");
      setTimeOfDay("night");

      gsap.to(globe, {
        xPercent: apex.xPercent,
        yPercent: apex.yPercent - 12,
        scale: window.innerWidth < 860 ? 0.62 : 0.52,
        rotation: 0,
        duration: 2.6,
        ease: "power2.out"
      });
    },
    onLeaveBack: () => {
      setBodyMode("earth");
      animateToStep(path[path.length - 1], 1.2);
    }
  });

  ScrollTrigger.refresh();
}

window.addEventListener("load", initScrollAnimation);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initScrollAnimation, 160);
});
