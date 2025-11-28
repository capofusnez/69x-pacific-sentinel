// utils/db.js

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Funzione per ottenere il percorso completo di un file di dati.
 * @param {string} filename Il nome del file (es. 'levels.json').
 * @returns {string} Il percorso assoluto del file.
 */
function getFilePath(filename) {
    return path.join(__dirname, '..', 'data', filename);
}

/**
 * Inizializza i file JSON se non esistono.
 */
function getInitialData() {
    console.log('\n--- Inizializzazione Dati ---');

    // Mappa dei nomi dei file ai loro contenuti iniziali
    const initialContents = {
        [config.FILES.SERVER_CONFIG]: { name: "69x Pacific Land...", ip: "..." },
        [config.FILES.LEVELS]: {},
        [config.FILES.AI_SESSIONS]: {},
        [config.FILES.PERMISSIONS]: { allowedRoles: [], ownerOverride: true },
        [config.FILES.RULES_MESSAGE]: {}
    };

    let allLoaded = true;
    
    for (const [key, initialData] of Object.entries(initialContents)) {
        const filePath = getFilePath(key);
        try {
            if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                fs.writeFileSync(filePath, JSON.stringify(initialData, null, 4));
                console.log(`✅ File ${key} creato e inizializzato.`);
            } else {
                console.log(`✅ ${key} caricato.`);
            }
        } catch (error) {
            console.error(`❌ Errore durante l'inizializzazione del file ${key}:`, error.message);
            allLoaded = false;
        }
    }

    if (allLoaded) {
        console.log('----------------------------');
        return true;
    } else {
        console.log('----------------------------');
        return false;
    }
}

/**
 * Legge i dati da un file JSON.
 * @param {string} filename Il nome del file.
 * @returns {object|null} Il contenuto del file come oggetto JSON.
 */
function getData(filename) {
    try {
        const filePath = getFilePath(filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Errore leggendo i dati da ${filename}:`, error.message);
        return null;
    }
}

/**
 * Salva un oggetto JavaScript in un file JSON.
 * @param {string} filename Il nome del file.
 * @param {object} data L'oggetto da salvare.
 */
function saveData(filename, data) {
    try {
        const filePath = getFilePath(filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
        console.error(`Errore salvando i dati in ${filename}:`, error.message);
    }
}

// --------------------------------------------------------
// ESPORTAZIONE MODULI
// --------------------------------------------------------

module.exports = {
    getInitialData, // <-- QUESTA ESPORTAZIONE DEVE ESSERE PRESENTE
    getData,
    saveData,
};
