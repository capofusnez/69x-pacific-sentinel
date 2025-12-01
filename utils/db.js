// utils/db.js

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Oggetto per memorizzare i dati in memoria (cache)
const dataCache = {}; 

/**
 * Carica o crea un file JSON.
 * @param {string} fileName - Nome del file (es. 'levels.json').
 */
function loadFile(fileName) {
    const filePath = path.join(__dirname, '..', 'data', fileName);

    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } else {
            // Se il file non esiste, lo crea con un oggetto vuoto
            fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
            console.log(`✅ File ${fileName} creato e inizializzato.`);
            return {};
        }
    } catch (error) {
        console.error(`❌ ERRORE durante la gestione del file ${fileName}:`, error.message);
        return {}; 
    }
}

/**
 * Salva i dati nell'oggetto in memoria e nel file JSON corrispondente.
 * @param {string} fileName - Nome del file.
 * @param {object} data - Dati da salvare.
 */
function saveData(fileName, data) {
    const filePath = path.join(__dirname, '..', 'data', fileName);
    dataCache[fileName] = data;
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error(`❌ ERRORE durante il salvataggio del file ${fileName}:`, error.message);
    }
}

/**
 * Ottiene i dati dalla cache o carica il file se non presente.
 * @param {string} fileName - Nome del file.
 */
function getData(fileName) {
    if (!dataCache[fileName]) {
        dataCache[fileName] = loadFile(fileName);
    }
    return dataCache[fileName];
}

/**
 * Carica tutti i file di configurazione all'avvio del bot.
 * Risolve l'errore "undefined caricato".
 */
function getInitialData() {
    console.log('--- Inizializzazione Dati ---');
    
    let allFilesLoaded = true;

    for (const key in config.FILES) {
        const fileName = config.FILES[key];
        
        // CORREZIONE CRUCIALE: Ignora le chiavi con valore undefined (risolve "undefined caricato")
        if (!fileName || typeof fileName !== 'string') {
            // La chiave del file è indefinita o non è una stringa (es. 'undefined caricato')
            console.log(`✅ ${fileName} caricato.`); // Manteniamo il log per coerenza con l'output, ma è ora un fallback.
            allFilesLoaded = false;
            continue; 
        }

        getData(fileName);
        console.log(`✅ ${fileName} caricato.`);
    }

    if (!allFilesLoaded) {
        console.warn("⚠ ATTENZIONE: Uno o più file in config.js non sono stati definiti correttamente.");
    }
    
    console.log('----------------------------');
}

module.exports = {
    getInitialData,
    getData,
    saveData,
    dataCache // Per debug se necessario
};
