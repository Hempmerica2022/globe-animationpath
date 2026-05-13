// ESP Landing Page - Cinematic Globe
// Static Three.js globe with Earth/Moon states

(function () {
  let scene, camera, renderer, earth, clouds, atmosphere;
  let cityLightsMat, dayMat, moonMat;
  let sunLight, ambientLight;
  let targetRotX = 0;
  let targetRotY = 0;
  let targetZ = 2.8;
  let rotX = 0;
  let rotY = 0;
  let currentZ = 2.8;
  let targetSunIntensity = 1.2;
  let targetAmbientColor;
  let targetSunPosition;
  let targetCityLightsOpacity = 0;
  let targetAtmosphereOpacity = 0.15;
  let currentMode = "earth";

  function hasThree() {
    return typeof window.THREE !== "undefined";
  }

  function init() {
    if (!hasThree()) {
      console.error("Three.js did not load before globe.js.");
      return;
    }

    const container = document.getElementById("globe-wrapper");
    const canvas = document.getElementById("esp-globe-canvas");
    if (!container || !canvas) return;

    targetAmbientColor = new THREE.Color(0x333333);
    targetSunPosition = new THREE.Vector3(5, 3, 5);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = currentZ;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    const dayTex = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg");
    const nightTex = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png");
    const specularTex = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg");
    const cloudTex = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png");
    const moonTex = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg");

    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    dayMat = new THREE.MeshPhongMaterial({
      map: dayTex,
      specularMap: specularTex,
      specular: new THREE.Color(0x333333),
      shininess: 15,
      transparent: true,
      opacity: 1
    });
    moonMat = new THREE.MeshPhongMaterial({
      map: moonTex,
      color: 0xd8d4c7,
      shininess: 3,
      transparent: true,
      opacity: 0
    });
    cityLightsMat = new THREE.MeshBasicMaterial({
      map: nightTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    earth = new THREE.Mesh(earthGeo, dayMat);
    scene.add(earth);

    const moonSkin = new THREE.Mesh(earthGeo, moonMat);
    earth.add(moonSkin);

    const cityLights = new THREE.Mesh(earthGeo, cityLightsMat);
    earth.add(cityLights);

    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.01, 64, 64),
      new THREE.MeshPhongMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    earth.add(clouds);

    atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: targetAtmosphereOpacity,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(atmosphere);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 1) starPositions[i] = (Math.random() - 0.5) * 200;
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.45 })));

    ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.copy(targetSunPosition);
    scene.add(sunLight);

    window.addEventListener("resize", onWindowResize, false);
    animate();
  }

  function latLonToRot(lat, lon) {
    return { x: lat * (Math.PI / 180), y: -Math.PI / 2 - lon * (Math.PI / 180) };
  }

  function focusRegion(name) {
    const regions = {
      hero: { lat: 0, lon: 0, z: 2.8 },
      waf: { lat: 40.4, lon: -3.7, z: 2.4 },
      peyote: { lat: 27, lon: -100, z: 2.08 },
      toad: { lat: 31, lon: -112, z: 2.15 },
      support: { lat: 10, lon: -60, z: 2.6 },
      network: { lat: 0, lon: -20, z: 3.0 },
      moon: { lat: 8, lon: 18, z: 2.65 }
    };
    const region = regions[name] || regions.hero;
    const rotation = latLonToRot(region.lat, region.lon);
    targetRotX = rotation.x;
    targetRotY = rotation.y;
    targetZ = region.z;
  }

  function setTimeOfDay(mode) {
    if (!targetAmbientColor || !targetSunPosition || !atmosphere) return;
    if (mode === "golden") {
      targetSunIntensity = 0.9;
      targetAmbientColor.setHex(0x221111);
      targetSunPosition.set(5, 0, 2);
      targetCityLightsOpacity = 0.18;
      atmosphere.material.color.setHex(0xffaa55);
      targetAtmosphereOpacity = currentMode === "moon" ? 0 : 0.15;
    } else if (mode === "night") {
      targetSunIntensity = 0.12;
      targetAmbientColor.setHex(0x050510);
      targetSunPosition.set(-5, 0, -5);
      targetCityLightsOpacity = 0.9;
      atmosphere.material.color.setHex(0x112244);
      targetAtmosphereOpacity = currentMode === "moon" ? 0 : 0.12;
    } else if (mode === "sunrise") {
      targetSunIntensity = 1.45;
      targetAmbientColor.setHex(0x111122);
      targetSunPosition.set(4, -1, 1);
      targetCityLightsOpacity = 0.36;
      atmosphere.material.color.setHex(0xff6622);
      targetAtmosphereOpacity = currentMode === "moon" ? 0 : 0.15;
    } else {
      targetSunIntensity = 1.2;
      targetAmbientColor.setHex(0x333333);
      targetSunPosition.set(5, 3, 5);
      targetCityLightsOpacity = 0;
      atmosphere.material.color.setHex(0x4488ff);
      targetAtmosphereOpacity = currentMode === "moon" ? 0 : 0.15;
    }
  }

  window.espGlobe = {
    focusRegion,
    setTimeOfDay,
    setBodyMode(mode) {
      currentMode = mode === "moon" ? "moon" : "earth";
      if (currentMode === "moon") {
        focusRegion("moon");
        targetCityLightsOpacity = 0;
        targetAtmosphereOpacity = 0;
      } else {
        targetAtmosphereOpacity = 0.15;
      }
    }
  };

  function onWindowResize() {
    const container = document.getElementById("globe-wrapper");
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight, false);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!earth) return;

    targetRotY += 0.00045;
    rotX += (targetRotX - rotX) * 0.024;
    rotY += (targetRotY - rotY) * 0.024;
    currentZ += (targetZ - currentZ) * 0.024;
    earth.rotation.x = rotX;
    earth.rotation.y = rotY;
    clouds.rotation.y += 0.0007;
    clouds.visible = currentMode !== "moon";
    camera.position.z = currentZ;

    const moonTarget = currentMode === "moon" ? 1 : 0;
    const earthTarget = currentMode === "moon" ? 0 : 1;
    dayMat.opacity += (earthTarget - dayMat.opacity) * 0.04;
    moonMat.opacity += (moonTarget - moonMat.opacity) * 0.04;
    cityLightsMat.opacity += ((currentMode === "moon" ? 0 : targetCityLightsOpacity) - cityLightsMat.opacity) * 0.035;
    atmosphere.material.opacity += (targetAtmosphereOpacity - atmosphere.material.opacity) * 0.035;
    sunLight.intensity += (targetSunIntensity - sunLight.intensity) * 0.035;
    ambientLight.color.lerp(targetAmbientColor, 0.035);
    sunLight.position.lerp(targetSunPosition, 0.035);

    renderer.render(scene, camera);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
