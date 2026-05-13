// ESP Landing Page - Cinematic Globe
// Built with Three.js

(function() {
  let scene, camera, renderer, earth, clouds, atmosphere;
  let cityLightsMat, dayMat;
  let sunLight, ambientLight;
  
  // Animation state
  let targetRotX = 0;
  let targetRotY = 0;
  let targetZ = 2.8;
  
  // Current state
  let rotX = 0;
  let rotY = 0;
  let currentZ = 2.8;
  
  // Lighting state targets
  let targetSunIntensity = 1.2;
  let targetAmbientColor = new THREE.Color(0x333333);
  let targetSunPosition = new THREE.Vector3(5, 3, 5);
  let targetCityLightsOpacity = 0.0;
  
  function init() {
    const container = document.getElementById('globe-wrapper');
    if (!container) return;
    
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.z = currentZ;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
      canvas: document.getElementById('esp-globe-canvas'),
      antialias: true, 
      alpha: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Textures
    const textureLoader = new THREE.TextureLoader();
    const dayTex = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
    const nightTex = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png');
    const specularTex = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');
    const cloudTex = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png');
    
    // Earth Geometry
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    
    // Materials
    dayMat = new THREE.MeshPhongMaterial({
      map: dayTex,
      specularMap: specularTex,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    
    cityLightsMat = new THREE.MeshBasicMaterial({
      map: nightTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    
    // Earth Mesh (Day)
    earth = new THREE.Mesh(earthGeo, dayMat);
    scene.add(earth);
    
    // City Lights Mesh (Overlay)
    const cityLights = new THREE.Mesh(earthGeo, cityLightsMat);
    earth.add(cityLights); // Add as child so it rotates with earth
    
    // Clouds
    const cloudGeo = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    clouds = new THREE.Mesh(cloudGeo, cloudMat);
    earth.add(clouds);
    
    // Atmosphere glow
    atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(atmosphere);
    
    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));
    
    // Lights
    ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.copy(targetSunPosition);
    scene.add(sunLight);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start animation loop
    animate();
  }
  
  function latLonToRot(lat, lon) {
    return {
      x: lat * (Math.PI / 180),
      y: -Math.PI / 2 - lon * (Math.PI / 180)
    };
  }
  
  // Public API exposed to the scroll script
  window.espGlobe = {
    focusRegion(name) {
      switch(name) {
        case 'hero':
          // Neutral Atlantic view
          targetRotX = 0;
          targetRotY = 0;
          targetZ = 2.8;
          break;
        case 'psycon':
          // Denver: ~39.7N, 104.9W
          const denver = latLonToRot(39.7, -104.9);
          targetRotX = denver.x;
          targetRotY = denver.y;
          targetZ = 2.2; // slight zoom
          break;
        case 'waf':
          // Spain: ~40.4N, 3.7W
          const spain = latLonToRot(40.4, -3.7);
          targetRotX = spain.x;
          targetRotY = spain.y;
          targetZ = 2.4;
          break;
        case 'peyote':
          // Northern Mexico / Texas: ~27N, 100W
          const peyote = latLonToRot(27, -100);
          targetRotX = peyote.x;
          targetRotY = peyote.y;
          targetZ = 2.0; // tighter zoom for intimacy
          break;
        case 'support':
          // Pull back slightly, drifting
          targetRotX = 10 * (Math.PI / 180);
          targetRotY = -Math.PI / 2 - (-60) * (Math.PI / 180); // mid-atlantic
          targetZ = 2.6;
          break;
        case 'network':
          // Full globe view
          targetRotX = 0;
          targetRotY = -Math.PI / 2 - (-20) * (Math.PI / 180); // Africa/Europe centered
          targetZ = 3.0;
          break;
      }
    },
    
    setTimeOfDay(mode) {
      switch(mode) {
        case 'day':
          targetSunIntensity = 1.2;
          targetAmbientColor.setHex(0x333333);
          targetSunPosition.set(5, 3, 5); // Front-right lighting
          targetCityLightsOpacity = 0.0;
          atmosphere.material.color.setHex(0x4488ff);
          break;
        case 'golden':
          // Warmer, lower angle light
          targetSunIntensity = 0.9;
          targetAmbientColor.setHex(0x221111);
          targetSunPosition.set(5, 0, 2); // Lower horizon
          targetCityLightsOpacity = 0.2;
          atmosphere.material.color.setHex(0xffaa55);
          break;
        case 'night':
          // Sun moves behind, city lights come up
          targetSunIntensity = 0.1;
          targetAmbientColor.setHex(0x050510);
          targetSunPosition.set(-5, 0, -5); // Backlighting
          targetCityLightsOpacity = 0.95;
          atmosphere.material.color.setHex(0x112244);
          break;
        case 'sunrise':
          // Strong rim light, transitioning from dark
          targetSunIntensity = 1.5;
          targetAmbientColor.setHex(0x111122);
          targetSunPosition.set(4, -1, 1); // Coming up over the edge
          targetCityLightsOpacity = 0.4;
          atmosphere.material.color.setHex(0xff6622);
          break;
      }
    }
  };
  
  function onWindowResize() {
    const container = document.getElementById('globe-wrapper');
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  function animate() {
    requestAnimationFrame(animate);
    
    if (!earth) return;
    
    // Smoothly interpolate rotations (cinematic ease)
    // Add a tiny constant rotation for ambient life
    targetRotY += 0.0005; 
    
    rotX += (targetRotX - rotX) * 0.02;
    rotY += (targetRotY - rotY) * 0.02;
    currentZ += (targetZ - currentZ) * 0.02;
    
    earth.rotation.x = rotX;
    earth.rotation.y = rotY;
    
    // Slowly rotate clouds independently
    clouds.rotation.y += 0.0008;
    
    camera.position.z = currentZ;
    
    // Interpolate lighting
    sunLight.intensity += (targetSunIntensity - sunLight.intensity) * 0.03;
    ambientLight.color.lerp(targetAmbientColor, 0.03);
    sunLight.position.lerp(targetSunPosition, 0.03);
    
    // Interpolate city lights
    cityLightsMat.opacity += (targetCityLightsOpacity - cityLightsMat.opacity) * 0.03;
    
    renderer.render(scene, camera);
  }
  
  // Load Three.js dynamically then init
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = init;
  document.head.appendChild(script);
  
})();
