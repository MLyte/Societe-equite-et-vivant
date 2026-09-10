// Montage spéculatif vers 2250, 10 secondes, sans texte ni piste audio.
// Sources et prompts imagegen : assets/future-scenes.json.
// Export hors ligne : FFmpeg et Playwright (ou PLAYWRIGHT_MODULE).
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('.', import.meta.url));
const scenes = JSON.parse(readFileSync(join(root, 'assets/future-scenes.json'), 'utf8'));
const images = scenes.map((scene) => `data:image/png;base64,${readFileSync(join(root, 'assets', scene.file)).toString('base64')}`);
const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
const fps = 24;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [name, width, height] of [['future-loop', 2160, 720], ['future-loop-mobile', 960, 540]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent('<canvas></canvas>');
    await page.evaluate(async ({ images, scenes, width, height, duration }) => {
      const canvas = document.querySelector('canvas');
      canvas.width = width; canvas.height = height;
      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false });
      if (!gl) throw Error('WebGL indisponible.');
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `
        attribute vec2 position; varying vec2 uv;
        void main() { uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5); gl_Position = vec4(position, 0.0, 1.0); }
      `);
      const fragment = compile(gl.FRAGMENT_SHADER, `
        precision highp float;
        uniform sampler2D sceneA; uniform sampler2D sceneB;
        uniform float time; uniform float kind; uniform float dissolve;
        uniform float outputAspect; uniform float aspectA; uniform float aspectB;
        uniform float focusA; uniform float focusB; uniform vec2 dropOrigin;
        varying vec2 uv;
        float random(float n) { return fract(sin(n * 12.9898 + 78.233) * 43758.5453); }
        vec2 project(float aspect, float focus) {
          vec2 p = uv;
          if (outputAspect < aspect) p.x = focus + (uv.x - 0.5) * outputAspect / aspect;
          else p.y = 0.5 + (uv.y - 0.5) * aspect / outputAspect;
          return p;
        }
        vec3 renderScene(sampler2D source, vec2 p, float t, float effect) {
          vec2 q = p;
          vec3 original = texture2D(source, p).rgb;
          // Chaleur : déformation infime, limitée à la chaussée ou aux flammes.
          if (effect > 0.5 && effect < 1.5) q.x += 0.00055 * smoothstep(0.62, 0.94, p.y) * sin(p.y * 190.0 + t * 3.2);
          if (effect > 2.5 && effect < 3.5) {
            float warmth = smoothstep(0.06, 0.3, original.r - original.b);
            q.x += 0.0005 * warmth * sin(p.y * 80.0 - t * 4.0);
          }
          // Inondation : seuls les reflets bougent, pas les personnes ni le bateau.
          if (effect > 3.5 && effect < 4.5) {
            float water = smoothstep(0.67, 0.78, p.y);
            q.x += water * 0.0010 * sin(p.y * 110.0 + p.x * 10.0 - t * 2.0);
            q.y += water * 0.0005 * sin(p.x * 22.0 + t * 1.7);
          }
          vec3 color = texture2D(source, clamp(q, 0.001, 0.999)).rgb;
          float haze = (0.5 + 0.5 * sin(p.x * 8.0 + p.y * 5.0 - t * 0.45)) * (0.5 + 0.5 * sin(p.x * 3.0 - p.y * 9.0 + t * 0.28));
          if (effect < 1.5 || effect > 4.5) {
            vec3 hazeColor = effect > 0.5 && effect < 1.5 ? vec3(0.64, 0.55, 0.4) : vec3(0.43, 0.46, 0.43);
            color = mix(color, hazeColor, haze * 0.038);
          }
          // Une seule goutte traverse le petit intervalle sous le robinet.
          if (effect > 1.5 && effect < 2.5) {
            float fall = clamp((t - 0.40) / 0.55, 0.0, 1.0);
            vec2 centre = dropOrigin + vec2(0.0, 0.12 * fall * fall);
            vec2 d = (p - centre) / vec2(0.0010, 0.0035 + 0.0015 * fall);
            float droplet = exp(-dot(d, d) * 1.5) * step(0.4, t) * (1.0 - step(0.95, t));
            color = mix(color, vec3(0.82, 0.84, 0.8), droplet * 0.72);
          }
          if (effect > 2.5 && effect < 3.5) {
            float warm = smoothstep(0.04, 0.25, original.r - original.b);
            color *= 1.0 + warm * (0.045 * sin(t * 4.0) + 0.022 * sin(t * 7.0 + 0.8));
          }
          // Cendres et braises fines, sans déformer le décor.
          if (effect < 0.5 || (effect > 2.5 && effect < 3.5)) {
            bool ember = effect > 2.5;
            for (int i = 0; i < 22; i++) {
              float seed = float(i) + 1.0;
              float px = fract(random(seed) + t * (ember ? 0.017 : 0.008));
              float py = fract(random(seed + 41.0) + t * (ember ? -0.075 : 0.019));
              vec2 d = (p - vec2(px, py)) / vec2(0.00045 + random(seed + 19.0) * 0.0003, ember ? 0.0017 : 0.0010);
              float speck = exp(-dot(d, d));
              color += speck * (ember ? vec3(0.55, 0.24, 0.07) : vec3(0.13, 0.13, 0.12));
            }
          }
          return color;
        }
        void main() {
          vec3 a = renderScene(sceneA, project(aspectA, focusA), time, kind);
          if (dissolve > 0.0) {
            vec3 b = renderScene(sceneB, project(aspectB, focusB), 0.0, 0.0);
            a = mix(a, b, dissolve);
          }
          gl_FragColor = vec4(a, 1.0);
        }
      `);
      const program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const textures = [];
      for (const data of images) {
        const img = new Image(); img.src = data; await img.decode();
        const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        textures.push({ texture, aspect: img.width / img.height });
      }
      const uniform = (name) => gl.getUniformLocation(program, name);
      gl.uniform1i(uniform('sceneA'), 0); gl.uniform1i(uniform('sceneB'), 1);
      gl.uniform1f(uniform('outputAspect'), width / height);
      gl.uniform1f(uniform('aspectB'), textures[0].aspect);
      gl.uniform1f(uniform('focusB'), scenes[0].focus ?? 0.5);
      gl.uniform2f(uniform('dropOrigin'), scenes[2].drop?.[0] ?? 0.5, scenes[2].drop?.[1] ?? 0.44);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[0].texture);
      window.renderFrame = (seconds) => {
        const t = seconds % duration;
        let index = 0; let start = 0;
        while (index < scenes.length - 1 && t >= start + scenes[index].duration) start += scenes[index++].duration;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[index].texture);
        gl.uniform1f(uniform('aspectA'), textures[index].aspect);
        gl.uniform1f(uniform('focusA'), scenes[index].focus ?? 0.5);
        gl.uniform1f(uniform('time'), t - start); gl.uniform1f(uniform('kind'), index);
        const transition = Math.max(0, Math.min(1, (t - duration + 0.32) / 0.32));
        gl.uniform1f(uniform('dissolve'), transition * transition * (3 - 2 * transition));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return canvas.toDataURL('image/png').split(',')[1];
      };
    }, { images, scenes, width, height, duration });
    const frameAt = async (seconds) => Buffer.from(await page.evaluate(t => window.renderFrame(t), seconds), 'base64');
    const first = await frameAt(0);
    const seam = await frameAt(duration);
    const hash = data => createHash('sha256').update(data).digest('hex');
    if (hash(first) !== hash(seam)) throw Error('Raccord de boucle incorrect.');
    writeFileSync(join(tmpdir(), `${name}-first.png`), first);
    let start = 0;
    for (const scene of scenes) {
      writeFileSync(join(tmpdir(), `${name}-${scene.name}.png`), await frameAt(start + scene.duration / 2));
      start += scene.duration;
    }
    writeFileSync(join(tmpdir(), `${name}-last.png`), await frameAt(duration - 1 / fps));
    const output = join(root, 'assets', `${name}.mp4`);
    const encoder = spawn('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',output], { windowsHide: true, stdio: ['pipe','ignore','pipe'] });
    let errors = ''; encoder.stderr.on('data', chunk => { errors += chunk; });
    const completion = once(encoder, 'close');
    for (let frame = 0; frame < duration * fps; frame++) {
      const data = frame === 0 ? first : await frameAt(frame / fps);
      if (!encoder.stdin.write(data)) await once(encoder.stdin, 'drain');
      if (frame % 60 === 0) console.log(`${name} : ${frame}/${duration * fps} images`);
    }
    encoder.stdin.end(); const [code] = await completion;
    if (code !== 0) throw Error(`FFmpeg : ${errors}`);
    console.log(`${name} : ${duration} s, ${width} × ${height}, ${statSync(output).size} octets ; raccord vérifié.`);
    await page.close();
  }
} finally { await browser.close(); }
