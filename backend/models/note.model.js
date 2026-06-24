const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    userId: String,          // si tu veux gérer plusieurs utilisateurs
    walletId: String,        // si tu veux une note par wallet
    content: String,         // ton texte
    updatedAt: { type: Date, default: Date.now }
});

const NoteModel = mongoose.model("note", noteSchema);

module.exports = NoteModel;