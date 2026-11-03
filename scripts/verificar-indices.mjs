import { getApp } from "firebase-admin/app";
import { conectar } from "./firebase-admin-local.mjs";
try {
  const { projectId } = conectar(), token = await getApp().options.credential.getAccessToken();
  const resposta = await fetch("https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/collectionGroups/-/indexes", { headers: { Authorization: "Bearer " + token.access_token } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error("HTTP " + resposta.status);
  const indices = dados.indexes ?? [];
  console.log(JSON.stringify(indices.map(i => ({ grupo: i.name.split("/collectionGroups/")[1].split("/")[0], campos: i.fields.map(f => f.fieldPath), estado: i.state })), null, 2));
  if (indices.some(i => i.state !== "READY")) process.exitCode = 2;
} catch (e) { console.error("Consulta de índices: " + e.message); process.exitCode = 1; }
