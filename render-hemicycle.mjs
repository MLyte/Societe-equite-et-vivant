// Export hors ligne : nécessite FFmpeg et Playwright (ou PLAYWRIGHT_MODULE).
// Source créée avec le générateur d’images intégré, sans API externe.
// Brief : hémicycle fictif désert à la lumière cuivrée du crépuscule,
// rangées de sièges sauge, sol inondé, ville et arbres nus derrière les baies.
// Plan panoramique fixe, tragique et politique, sans personnes, texte ni drapeau.
// Les seules déformations concernent l’eau ; les architectures restent fixes.
/* Prompt de génération du visuel (outil imagegen intégré) :
Use case: stylized-concept.
Create one exceptionally cinematic photorealistic panoramic establishing image for a short seamlessly looping website film. A fictional empty parliamentary hemicycle at dusk, seen symmetrically from the back with a fixed wide camera, low enough to see the water on the floor. Neatly aligned curved ranks of empty muted sage seats flank a modest central speaking desk. A shallow sheet of still reflective floodwater has entered the central floor. Large tall windows behind the desk look onto a distant subdued city, a few bare trees and a heavy overcast sky. One restrained shaft of late copper light reaches the centre. A few tiny autumn leaves float in the foreground. Solemn, tragic, political through the absence of people and suspended decision-making, contemplative rather than spectacular. Realistic prestigious civic architecture, restrained European modern classicism, physically believable materials, no real identifiable parliament. High photographic quality, fine architectural detail, natural perspective, atmospheric depth. Muted graphite #252A2D, sage #536459, aged copper #93634E and soft warm white palette matching a sober editorial website.
Composition is crucial: ultra-wide panoramic 4:1 aspect ratio, preferably 4096x1024; ONE continuous landscape, not panels or a collage. Place the recognisable central speaking desk, windows, seat arcs and their water reflection within the central horizontal band, keeping important scene information between 25% and 75% of image height so a very shallow desktop banner can crop it. Keep the central 40% of image width interesting and legible for a mobile centre crop. Foreground bottom third primarily reflective water with unobstructed surfaces that can be animated; ceiling and extreme edges unimportant. Water level stays constant. Camera fixed, quiet surface, no motion blur. No people, no flags, no symbols of a real party, no text, no lettering, no numbers, no logos, no signage, no watermark.
*/
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
const image = `data:image/png;base64,${readFileSync(join(root, 'assets/hemicycle-source.png')).toString('base64')}`;
const duration = 12;
const fps = 24;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

try {
  for (const [name, width, height] of [['hemicycle-loop', 2160, 720], ['hemicycle-loop-mobile', 960, 540]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent('<canvas></canvas>');
    await page.evaluate(async ({ image, width, height }) => {
      const canvas = document.querySelector('canvas');
      canvas.width = width;
      canvas.height = height;
      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false });
      if (!gl) throw Error('WebGL indisponible pour le rendu vidéo.');
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 uv;
        void main() { uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5); gl_Position = vec4(position, 0.0, 1.0); }
      `);
      const fragment = compile(gl.FRAGMENT_SHADER, `
        precision highp float;
        uniform sampler2D scene;
        uniform float phase;
        uniform float outputAspect;
        uniform float sourceAspect;
        varying vec2 uv;
        void main() {
          vec2 p = uv;
          if (outputAspect < sourceAspect) p.x = 0.5 + (uv.x - 0.5) * outputAspect / sourceAspect;
          else p.y = 0.5 + (uv.y - 0.5) * sourceAspect / outputAspect;
          float shore = 0.495 + 0.10 * smoothstep(0.06, 0.48, abs(p.x - 0.5));
          float water = smoothstep(shore, shore + 0.045, p.y);
          float depth = smoothstep(0.49, 1.0, p.y);
          vec2 sampleAt = p;
          float rippleA = sin(p.y * 132.0 + sin(p.x * 17.0) * 1.6 + phase * 2.0);
          float rippleB = sin(p.y * 271.0 - p.x * 11.0 - phase * 3.0);
          float rippleC = sin(p.x * 36.0 + p.y * 48.0 + phase);
          sampleAt.x += water * (0.0010 + depth * 0.0032) * (rippleA + 0.42 * rippleB);
          sampleAt.y += water * depth * 0.0016 * rippleC;
          vec3 color = texture2D(scene, clamp(sampleAt, 0.001, 0.999)).rgb;
          float reflection = exp(-pow((p.x - 0.52) * 6.0, 2.0));
          float shimmer = water * (0.4 + 0.6 * reflection) * (rippleA * 0.007 + rippleB * 0.004);
          color += vec3(1.0, 0.82, 0.63) * shimmer;
          float light = 1.0 + (0.013 * sin(phase) + 0.007 * sin(phase * 2.0 + 0.7)) * reflection;
          gl_FragColor = vec4(color * light, 1.0);
        }
      `);
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const source = new Image();
      source.src = image;
      await source.decode();
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform1f(gl.getUniformLocation(program, 'outputAspect'), width / height);
      gl.uniform1f(gl.getUniformLocation(program, 'sourceAspect'), source.width / source.height);
      const phase = gl.getUniformLocation(program, 'phase');
      window.renderFrame = (seconds) => {
        gl.uniform1f(phase, Math.PI * 2 * (seconds % 12) / 12);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return canvas.toDataURL('image/png').split(',')[1];
      };
    }, { image, width, height });

    const frameAt = async (seconds) => Buffer.from(await page.evaluate((t) => window.renderFrame(t), seconds), 'base64');
    const first = await frameAt(0);
    const seam = await frameAt(duration);
    if (createHash('sha256').update(first).digest('hex') !== createHash('sha256').update(seam).digest('hex')) throw Error('La boucle ne rejoint pas son image de départ.');
    writeFileSync(join(tmpdir(), `${name}-first.png`), first);
    writeFileSync(join(tmpdir(), `${name}-middle.png`), await frameAt(6));
    const output = join(root, 'assets', `${name}.mp4`);
    const encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderErrors = '';
    encoder.stderr.on('data', (chunk) => { encoderErrors += chunk; });
    const completion = once(encoder, 'close');
    for (let frame = 0; frame < duration * fps; frame += 1) {
      const data = frame === 0 ? first : await frameAt(frame / fps);
      if (!encoder.stdin.write(data)) await once(encoder.stdin, 'drain');
      if (frame % 72 === 0) console.log(`${name} : ${frame}/${duration * fps} images`);
    }
    encoder.stdin.end();
    const [code] = await completion;
    if (code !== 0) throw Error(`FFmpeg : ${encoderErrors}`);
    console.log(`${name} : ${duration} s, ${width} × ${height}, ${statSync(output).size} octets ; raccord exact vérifié.`);
    await page.close();
  }
} finally {
  await browser.close();
}
