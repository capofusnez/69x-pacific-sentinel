// utils/xpFormulas.js

/**
 * Calcola l'esperienza richiesta per raggiungere il livello specificato (per arrivare al livello successivo).
 * * @param {number} level Il livello attuale dell'utente.
 * @returns {number} L'XP totale richiesto per completare il livello 'level' e raggiungere 'level + 1'.
 */
function getNextLevelXp(level) {
    // Formula Semplice: BASE_XP + (Livello * XP_FACTOR)
    const BASE_XP = 100;
    const XP_FACTOR = 100;
    
    if (level < 0) return 0;

    // Esempio: Livello 0 richiede 100 XP per arrivare a Livello 1.
    // Livello 1 richiede 200 XP per arrivare a Livello 2.
    return BASE_XP + (level * XP_FACTOR);
}

module.exports = {
    getNextLevelXp
};
