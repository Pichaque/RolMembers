const fs = require('node:fs');
const path = require('node:path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las variables SUPABASE_URL y SUPABASE_ANON_KEY.');
  process.exit(1);
}

const directory = path.join(__dirname, '..', 'src', 'environments');

function source(production) {
  return `export const environment = {
  production: ${production},
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseKey: ${JSON.stringify(supabaseKey)},
};
`;
}

fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'environment.ts'), source(false));
fs.writeFileSync(path.join(directory, 'environment.prod.ts'), source(true));
console.log('Entornos generados en src/environments.');
