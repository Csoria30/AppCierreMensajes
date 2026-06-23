const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MESSAGES_TABLE = process.env.SUPABASE_MESSAGES_TABLE || "messages";

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno de Supabase. Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

function normalizeMessage(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    profile: {
      name: row.profile_name,
      email: row.profile_email,
    },
  };
}

function validatePayload(payload) {
  const title = payload.title?.trim();
  const category = payload.category?.trim();
  const body = payload.body?.trim();
  const profileName = payload.profileName?.trim();
  const profileEmail = payload.profileEmail?.trim() || null;

  if (!title || !category || !body || !profileName) {
    return {
      error:
        "Los campos título, categoría, cuerpo y nombre de perfil son obligatorios.",
    };
  }

  return {
    value: {
      title,
      category,
      body,
      profile_name: profileName,
      profile_email: profileEmail,
    },
  };
}

// GET /messages — obtener todos los mensajes
app.get("/messages", async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error:
        "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return res
      .status(500)
      .json({ error: `Error al cargar mensajes: ${error.message}` });
  }

  res.json(data.map(normalizeMessage));
});

// POST /messages — crear un nuevo mensaje
app.post("/messages", async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error:
        "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const validation = validatePayload(req.body);
  if (validation.error)
    return res.status(400).json({ error: validation.error });

  const newMessage = {
    id: Date.now().toString(),
    ...validation.value,
  };

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .insert(newMessage)
    .select("*")
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Error al crear mensaje: ${error.message}` });
  }

  res.status(201).json(normalizeMessage(data));
});

// PUT /messages/:id — editar un mensaje existente
app.put("/messages/:id", async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error:
        "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const { id } = req.params;
  const validation = validatePayload(req.body);
  if (validation.error)
    return res.status(400).json({ error: validation.error });

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .update({ ...validation.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error && error.code === "PGRST116") {
    return res.status(404).json({ error: "Mensaje no encontrado." });
  }

  if (error) {
    return res
      .status(500)
      .json({ error: `Error al actualizar mensaje: ${error.message}` });
  }

  res.json(normalizeMessage(data));
});

// DELETE /messages/:id — eliminar un mensaje
app.delete("/messages/:id", async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error:
        "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const { id } = req.params;
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return res
      .status(500)
      .json({ error: `Error al eliminar mensaje: ${error.message}` });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Mensaje no encontrado." });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
