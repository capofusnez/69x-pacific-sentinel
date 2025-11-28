// utils/db.js

const fs = require("fs");
const path = require("path");
const config = require("../config");

// Mantiene i dati in memoria (simulando un DB in memoria)
const cache = {};

/**
 * Carica un file JSON e lo memorizza nella cache
 */
async function loadData(fileName) {
    const filePath = path.join(config.DATA_PATH, fileName);
    try {
        if (!fs.existsSync(config.DATA_PATH)) {
            fs.mkdirSync(config.DATA_PATH, { recursive: true });
        }
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf8");
            cache[fileName] = JSON.parse(raw);
            return cache[fileName];
        } else {
            cache[fileName] = {};
            console.log(`⚠ ${fileName} non trovato, creato oggetto vuoto.`);
            await saveData(fileName, cache[fileName]);
            return cache[fileName];
        }
    } catch (err) {
        console.error(`⚠ Errore nel caricare ${fileName}:`, err);
        cache[fileName] = {}; // Fallback sicuro
        return cache[fileName];
    }
}

/**
 * Salva i dati di un file JSON (operazione sincrona/bloccante)
 */
function saveData(fileName, data) {
    const filePath = path.join(config.DATA_PATH, fileName);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error(`⚠ Errore nel salvare ${fileName}:`, err);
    }
}

/**
 * Ottiene i dati dalla cache
 */
function getData(fileName) {
    return cache[fileName] || {};
}

// Carica tutti i file all'avvio
async function loadAllData() {
    for (const key in config.FILES) {
        const fileName = config.FILES[key];
        await loadData(fileName);
        if (fileName === config.FILES.PERMISSIONS) {
             console.log("🔐 Permessi caricati:", cache[fileName]);
        } else if (fileName === config.FILES.RULES_MESSAGE) {
             console.log("📜 Info messaggio regole caricata:", cache[fileName]);
        } else {
             console.log(`✅ ${fileName} caricato.`);
        }
    }
}

module.exports = {
    loadAllData,
    getData,
    saveData
};
