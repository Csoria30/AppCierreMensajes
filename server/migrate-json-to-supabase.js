require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MESSAGES_TABLE = process.env.SUPABASE_MESSAGES_TABLE || "messages";
const DATA_FILE = path.join(__dirname, "..", "data", "messages.json");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno de Supabase. Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.error(`No existe el archivo de datos en ${DATA_FILE}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function mapLegacyMessage(msg) {
  return {
    id: String(msg.id),
    title: String(msg.title || "").trim(),
    category: String(msg.category || "").trim(),
    body: String(msg.body || "").trim(),
    profile_name: msg.profile?.name?.trim() || "Sin perfil",
    profile_email: msg.profile?.email?.trim() || null,
    created_at: msg.createdAt || new Date().toISOString(),
    updated_at: msg.updatedAt || null,
  };
}

(async () => {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const source = JSON.parse(raw);

  const rows = source
    .map(mapLegacyMessage)
    .filter((m) => m.title && m.category && m.body && m.profile_name);

  if (rows.length === 0) {
    console.log("No hay filas validas para migrar.");
    return;
  }

  const { error } = await supabase
    .from(MESSAGES_TABLE)
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Error migrando datos:", error.message);
    process.exit(1);
  }

  console.log(
    `Migracion completa: ${rows.length} mensajes enviados a Supabase.`,
  );
})();
