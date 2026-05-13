gsap.registerPlugin(ScrollTrigger);

const globe = document.getElementById("globe-wrapper");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function focusRegion(name) {
  if (window.espGlobe && typeof window.espGlobe.focusRegion === "function") {
    window.espGlobe.focusRegion(name);
  }
}

function setTimeOfDay(mode) {
  if (window.espGlobe && typeof window.espGlobe.setTimeOfDay === "function") {
    window.espGlobe.setTimeOfDay(mode);
  }
}

function getApexPosition() {
  const apex = document.getElementById("pyramid-apex");
  if (!apex) return { xPercent: 0, yPercent: 0 };

  const rect = apex.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return {
    xPercent: (centerX / window.innerWidth) * 100 - 50,
    yPercent: (centerY / window.innerHeight) * 100 - 50
  };
}

function buildPath() {
  const mobile = window.innerWidth < 768;

  if (mobile) {
    return [
      { id: "sec-rio",     x: 0,    y: -6,  scale: 0.5,  rotate: -4, region: "hero",    time: "day" },
      { id: "sec-waf",     x: -85,  y: -10, scale: 0.82, rotate: -8, region: "waf",     time: "day" },
      { id: "sec-peyote",  x: 85,   y: 6,   scale: 0.88, rotate: 8,  region: "peyote",  time: "night" },
      { id: "sec-toad",    x: -85,  y: 14,  scale: 0.92, rotate: -8, region: "peyote",  time: "night" },
      { id: "sec-support", x: 85,   y: 10,  scale: 0.86, rotate: 7,  region: "support", time: "sunrise" },
      { id: "sec-network", x: -85,  y: -6,  scale: 0.78, rotate: -6, region: "network", time: "day" }
    ];
  }

  return [
    { id: "sec-rio",     x: 0,    y: -4,  scale: 0.5,  rotate: -4, region: "hero",    time: "day" },
    { id: "sec-waf",     x: -85,  y: -10, scale: 0.90, rotate: -10, region: "waf",     time: "day" },
    { id: "sec-peyote",  x: 85,   y: 6,   scale: 0.98, rotate: 10,  region: "peyote",  time: "night" },
    { id: "sec-toad",    x: -85,  y: 18,  scale: 1.02, rotate: -10, region: "peyote",  time: "night" },
    { id: "sec-support", x: 85,   y: 10,  scale: 0.92, rotate: 8,   region: "support", time: "sunrise" },
    { id: "sec-network", x: -85,  y: -8,  scale: 0.84, rotate: -7,  region: "network", time: "day" }
  ];
}

function initScrollAnimation() {
  if (!globe) return;

  ScrollTrigger.getAll().forEach(t => t.kill());

  if (reduceMotion) {
    gsap.set(globe, {
      xPercent: 0,
      yPercent: 0,
      scale: 0.5,
      rotation: 0
    });
    return;
  }

  const path = buildPath();

  gsap.set(globe, {
    xPercent: path[0].x,
    yPercent: path[0].y,
    scale: path[0].scale,
    rotation: path[0].rotate
  });

  path.forEach(step => {
    ScrollTrigger.create({
      trigger: `#${step.id}`,
      start: "top center",
      onEnter: () => {
        focusRegion(step.region);
        setTimeOfDay(step.time);
      },
      onEnterBack: () => {
        focusRegion(step.region);
        setTimeOfDay(step.time);
      }
    });
  });

  path.forEach(step => {
    gsap.to(globe, {
      xPercent: step.x,
      yPercent: step.y,
      scale: step.scale,
      rotation: step.rotate,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: `#${step.id}`,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1
      }
    });
  });

  gsap.to(globe, {
    xPercent: () => getApexPosition().xPercent,
    yPercent: () => getApexPosition().yPercent - 10,
    scale: 0.5,
    rotation: 0,
    ease: "power2.inOut",
    scrollTrigger: {
      trigger: "#site-footer",
      start: "top 80%",
      end: "bottom bottom",
      scrub: 1.2,
      invalidateOnRefresh: true
    }
  });

  ScrollTrigger.create({
    trigger: "#site-footer",
    start: "top 70%",
    onEnter: () => {
      gsap.to(globe, {
        y: "-=12",
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        overwrite: false
      });
    },
    onLeaveBack: () => {
      gsap.killTweensOf(globe, "y");
      gsap.set(globe, { y: 0 });
    }
  });

  ScrollTrigger.refresh();
}

window.addEventListener("load", initScrollAnimation);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initScrollAnimation, 150);
});
