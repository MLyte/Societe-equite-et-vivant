import SftpClient from 'ssh2-sftp-client';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function deploymentConfig(env) {
  const required = ['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_PASSWORD', 'DEPLOY_REMOTE_DIR', 'DEPLOY_HOST_SHA256'];
  for (const key of required) if (!env[key]) throw new Error(`Configuration manquante : ${key}`);
  const directory = env.DEPLOY_REMOTE_DIR.replace(/\/$/, '');
  if (!/^\/[a-zA-Z0-9_./-]+\/societe-equite-vivant$/.test(directory) || directory.split('/').some((p) => p === '..' || p === '.')) {
    throw new Error('La destination doit être un chemin absolu dédié se terminant par /societe-equite-vivant.');
  }
  if (!/^[a-zA-Z0-9.-]+$/.test(env.DEPLOY_HOST)) throw new Error('Hôte de déploiement invalide.');
  if (!/^[a-fA-F0-9]{64}$/.test(env.DEPLOY_HOST_SHA256)) throw new Error('Empreinte SHA-256 du serveur invalide (64 caractères hexadécimaux attendus).');
  return {
    directory,
    access: { host: env.DEPLOY_HOST, port: 22, username: env.DEPLOY_USER, password: env.DEPLOY_PASSWORD, hostHash: 'sha256', hostVerifier: (hash) => hash === env.DEPLOY_HOST_SHA256.toLowerCase(), readyTimeout: 20000 },
  };
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Lien symbolique interdit dans les fichiers à publier.');
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else files.push(path);
  }
  return files;
}

export async function deploy({ env = process.env, directory = fileURLToPath(new URL('./dist', import.meta.url)), client = new SftpClient() } = {}) {
  const config = deploymentConfig(env);
  const index = resolve(directory, 'index.html');
  const html = await readFile(index, 'utf8');
  if (!html.includes('id="approfondir"') || html.includes('{{') || !(await stat(index)).size) throw new Error('Compilation absente ou incomplète.');
  const files = (await filesUnder(directory)).filter((file) => file !== index);
  // Never mirror/delete: retained hashed assets keep the previous page usable.
  // Upload the entry point last, then rename within the same remote directory.
  try {
    await client.connect(config.access);
    await client.mkdir(`${config.directory}/assets`, true);
    for (const file of files) {
      const name = relative(directory, file).split(sep).join('/');
      if (!/^assets\/[\w.-]+$/.test(name)) throw new Error(`Fichier de sortie inattendu : ${name}`);
      await client.put(file, `${config.directory}/${name}`);
    }
    await client.put(index, `${config.directory}/index.next.html`);
    await client.posixRename(`${config.directory}/index.next.html`, `${config.directory}/index.html`);
    console.log('Transfert SFTP terminé.');
  } finally { await client.end(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  deploy().catch(() => {
    // Server responses can echo account details. Keep CI output free of credentials.
    console.error('Déploiement interrompu. Vérifier la compilation, les secrets, l’empreinte SSH et le répertoire dédié.');
    process.exitCode = 1;
  });
}
