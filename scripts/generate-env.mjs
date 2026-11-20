import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const envFile = resolve(root, '.env');

function readDotEnv(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator < 1) return ['', ''];

        const name = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return [name, value];
      })
      .filter(([name]) => name),
  );
}

const fileVariables = readDotEnv(envFile);
const supabaseUrl = process.env['SUPABASE_URL'] || fileVariables['SUPABASE_URL'];
const supabasePublishableKey =
  process.env['SUPABASE_PUBLISHABLE_KEY'] ||
  fileVariables['SUPABASE_PUBLISHABLE_KEY'];

const missing = [];
if (!supabaseUrl) missing.push('SUPABASE_URL');
if (!supabasePublishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');

if (missing.length) {
  console.error(
    `Faltan variables de entorno: ${missing.join(', ')}. Configuralas en .env o en el entorno del proceso.`,
  );
  process.exit(1);
}

if (!/^https:\/\//.test(supabaseUrl)) {
  console.error('SUPABASE_URL debe ser una URL HTTPS válida.');
  process.exit(1);
}

const outputPath = resolve(root, 'src/environments/environment.ts');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `// Archivo generado automáticamente. No editar ni versionar.\nexport const environment = ${JSON.stringify(
    {
      supabaseUrl,
      supabasePublishableKey,
    },
    null,
    2,
  )} as const;\n`,
  'utf8',
);

console.log('Configuración de Supabase generada correctamente.');
