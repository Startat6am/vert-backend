import * as THREE from 'three';

export function createNodeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 1.0 },
      uColor: { value: new THREE.Color('#75dfff') }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vLocal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vLocal = position;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPulse;
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vLocal;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);
        float wave = 0.88 + 0.12 * sin(uTime * 2.0 + vLocal.y * 5.0);
        float core = 0.55 + 0.45 * max(dot(N, V), 0.0);
        vec3 color = uColor * (core * 0.72 + fresnel * 0.85) * wave * uPulse;
        gl_FragColor = vec4(color, 0.88);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false
  });
}

export function createEnergyLineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#55bde9') },
      uOpacity: { value: 0.14 }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vWorld = position;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vWorld;
      void main() {
        float pulse = pow(max(0.0, sin(vWorld.x * 1.7 - uTime * 2.2)), 14.0);
        float shimmer = 0.88 + 0.12 * sin(uTime * 1.4 + vWorld.y * 2.0);
        vec3 color = uColor * (0.28 + pulse * 0.55) * shimmer;
        gl_FragColor = vec4(color, uOpacity + pulse * 0.08);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false
  });
}

export function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float radial = exp(-dot(p * vec2(0.8, 1.15), p * vec2(0.8, 1.15)) * 8.0);
        float breathe = 0.96 + 0.04 * sin(uTime * 0.28);
        vec3 deep = vec3(0.012, 0.018, 0.038);
        vec3 glow = vec3(0.012, 0.055, 0.095) * radial * breathe;
        gl_FragColor = vec4(deep + glow, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    depthWrite: false
  });
}
