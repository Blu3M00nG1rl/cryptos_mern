const fs = require("fs");
const path = require("path");

// 📁 Dossier logs
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 📌 Génère un nom de fichier par jour
function getLogFilePath() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return path.join(logDir, `backend-${yyyy}-${mm}-${dd}.log`);
}

// ✍️ Fonction d’écriture
function writeLog(message) {
    const file = getLogFilePath();
    const line = `[${new Date().toISOString()}] ${message}\n`;

    fs.appendFile(file, line, (err) => {
        if (err) console.error("Erreur écriture log :", err);
    });
}

module.exports = writeLog;
