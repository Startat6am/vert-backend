export function createNodeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPulse: { value: 1.0 }, uColor: { value: new THREE.Color('#65dcff') } },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vViewPosition; varying vec3 vLocal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz; vLocal = position;
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uPulse; uniform vec3 uColor;
      varying vec3 vNormal; varying vec3 vViewPosition; varying vec3 vLocal;
      void main() {
        vec3 N = normalize(vNormal); vec3 V = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);
        float wave = 0.72 + 0.28 * sin(uTime * 3.0 + vLocal.y * 8.0);
        float core = 0.45 + 0.55 * max(dot(N, V), 0.0);
        vec3 color = uColor * (core * 0.65 + fresnel * 2.2) * wave * uPulse;
        gl_FragColor = vec4(color, 0.92);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
}

export function createEnergyLineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#48cfff') }, uOpacity: { value: 0.52 } },
    vertexShader: `
      varying vec3 vWorld;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vWorld = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform float uOpacity; varying vec3 vWorld;
      void main() {
        float pulse = pow(max(0.0, sin(vWorld.x * 2.4 - uTime * 4.0)), 10.0);
        float shimmer = 0.55 + 0.45 * sin(uTime * 2.0 + vWorld.y * 3.0);
        vec3 color = uColor * (0.35 + pulse * 2.8) * shimmer;
        gl_FragColor = vec4(color, uOpacity + pulse * 0.42);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
}

export function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float radial = exp(-dot(p * vec2(0.8, 1.15), p * vec2(0.8, 1.15)) * 8.0);
        float bands = 0.5 + 0.5 * sin(vUv.y * 18.0 - uTime * 0.35 + sin(vUv.x * 9.0));
        vec3 deep = vec3(0.012, 0.018, 0.055);
        vec3 glow = vec3(0.025, 0.12, 0.24) * radial * (0.65 + bands * 0.35);
        gl_FragColor = vec4(deep + glow, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthWrite: false
  });
}
