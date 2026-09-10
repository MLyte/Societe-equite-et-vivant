// Six scènes de fiction vers 2250 ; visuels imagegen animés hors ligne.
// Prompts et montage : assets/habitable-scenes.json. FFmpeg et Playwright requis.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('.', import.meta.url));
const { scenes, crossfade } = JSON.parse(readFileSync(join(root, 'assets/habitable-scenes.json'), 'utf8'));
const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
const fps = 24;
const images = scenes.map(scene => `data:image/png;base64,${readFileSync(join(root, 'assets', scene.file)).toString('base64')}`);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [name, width, height] of [['habitable-loop', 2160, 720], ['habitable-loop-mobile', 960, 540]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent('<canvas></canvas>');
    await page.evaluate(async ({ images, scenes, crossfade, duration, width, height }) => {
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
        uniform sampler2D imageA; uniform sampler2D imageB;
        uniform float aspectA; uniform float aspectB; uniform float outputAspect;
        uniform float kindA; uniform float kindB; uniform float timeA; uniform float timeB;
        uniform float dissolve;
        varying vec2 uv;
        vec2 project(float aspect) {
          vec2 p = uv;
          if (outputAspect < aspect) p.x = 0.5 + (uv.x - 0.5) * outputAspect / aspect;
          else p.y = 0.5 + (uv.y - 0.5) * aspect / outputAspect;
          return p;
        }
        vec3 animate(sampler2D source, vec2 p, float t, float kind) {
          vec3 original = texture2D(source, p).rgb;
          vec2 q = p;
          // Le feuillage seul oscille ; la zone des personnes reste stable.
          float green = smoothstep(0.012, 0.085, original.g - original.b)
            * smoothstep(-0.012, 0.045, original.g - original.r * 0.88);
          float sides = max(1.0 - smoothstep(0.25, 0.34, p.x), smoothstep(0.69, 0.78, p.x));
          float canopy = 1.0 - smoothstep(0.25, 0.34, p.y);
          float foliage = green * max(sides, canopy);
          float breeze = sin(t * 1.25 + p.x * 16.0 + p.y * 9.0);
          q.x += foliage * 0.0007 * breeze;
          q.y += foliage * 0.0009 * sin(t * 1.05 + p.x * 12.0);
          // Rivière : reflets bas, sans déplacer la passerelle ni les habitants.
          if (kind > 3.5 && kind < 4.5) {
            float water = smoothstep(0.68, 0.82, p.y) * smoothstep(0.22, 0.42, p.x);
            q.x += water * 0.0010 * sin(p.y * 100.0 - t * 2.4 + p.x * 12.0);
            q.y += water * 0.0005 * sin(p.x * 25.0 + t * 1.7);
          }
          // Fontaine : légères variations dans le jet, en conservant ses bords.
          float stream = 0.0;
          if (kind > 1.5 && kind < 2.5) {
            float along = smoothstep(0.456, 0.468, p.y) * (1.0 - smoothstep(0.571, 0.583, p.y));
            float axis = mix(0.539, 0.535, clamp((p.y - 0.456) / 0.127, 0.0, 1.0));
            stream = along * (1.0 - smoothstep(0.001, 0.004, abs(p.x - axis)));
            q.y += stream * 0.002 * sin(p.y * 270.0 - t * 12.0);
          }
          vec3 color = texture2D(source, clamp(q, 0.001, 0.999)).rgb;
          color *= 1.0 + foliage * 0.012 * sin(p.x * 11.0 + p.y * 8.0 - t * 0.8);
          color += stream * 0.025 * sin(p.y * 420.0 - t * 14.0);
          // Lumière diffuse de l'atelier, variation très faible et progressive.
          if (kind > 2.5 && kind < 3.5) color *= 1.0 + 0.006 * sin(t * 0.7 + p.x * 3.0);
          return color;
        }
        void main() {
          vec3 color = animate(imageA, project(aspectA), timeA, kindA);
          if (dissolve > 0.0) color = mix(color, animate(imageB, project(aspectB), timeB, kindB), dissolve);
          gl_FragColor = vec4(color, 1.0);
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
      const locations = new Map();
      const uniform = name => { if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name)); return locations.get(name); };
      gl.uniform1i(uniform('imageA'), 0); gl.uniform1i(uniform('imageB'), 1);
      gl.uniform1f(uniform('outputAspect'), width / height);
      window.renderFrame = seconds => {
        const t = ((seconds % duration) + duration) % duration;
        let index = 0; let start = 0;
        while (index < scenes.length - 1 && t >= start + scenes[index].duration) start += scenes[index++].duration;
        const next = (index + 1) % scenes.length;
        const local = t - start;
        const incoming = Math.max(0, local - scenes[index].duration + crossfade);
        const blend = Math.min(1, incoming / crossfade);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[index].texture);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[next].texture);
        gl.uniform1f(uniform('aspectA'), textures[index].aspect);
        gl.uniform1f(uniform('aspectB'), textures[next].aspect);
        gl.uniform1f(uniform('kindA'), index); gl.uniform1f(uniform('kindB'), next);
        // Le plan entrant poursuit le mouvement commencé pendant le fondu.
        gl.uniform1f(uniform('timeA'), local + crossfade); gl.uniform1f(uniform('timeB'), incoming);
        gl.uniform1f(uniform('dissolve'), blend * blend * (3 - 2 * blend));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return canvas.toDataURL('image/png').split(',')[1];
      };
    }, { images, scenes, crossfade, duration, width, height });
    const frameAt = async t => Buffer.from(await page.evaluate(seconds => window.renderFrame(seconds), t), 'base64');
    writeFileSync(join(tmpdir(), `${name}-first.png`), await frameAt(0));
    let start = 0;
    for (const scene of scenes) {
      writeFileSync(join(tmpdir(), `${name}-${scene.name}.png`), await frameAt(start + scene.duration / 2));
      writeFileSync(join(tmpdir(), `${name}-fade-${scene.name}.png`), await frameAt(start + scene.duration - crossfade / 2));
      start += scene.duration;
    }
    writeFileSync(join(tmpdir(), `${name}-last.png`), await frameAt(duration - 1 / fps));
    const output = join(root, 'assets', `${name}.mp4`);
    const encoder = spawn('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',output], { windowsHide: true, stdio: ['pipe','ignore','pipe'] });
    let errors = ''; encoder.stderr.on('data', chunk => { errors += chunk; });
    const completion = once(encoder, 'close');
    for (let frame = 0; frame < duration * fps; frame++) {
      if (!encoder.stdin.write(await frameAt(frame / fps))) await once(encoder.stdin, 'drain');
      if (frame % 60 === 0) console.log(`${name} : ${frame}/${duration * fps} images`);
    }
    encoder.stdin.end(); const [code] = await completion;
    if (code !== 0) throw Error(`FFmpeg : ${errors}`);
    console.log(`${name} : ${duration} s, ${width} × ${height}, ${statSync(output).size} octets.`);
    await page.close();
  }
} finally { await browser.close(); }
