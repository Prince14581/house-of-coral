const Rhythm = require('../models/Rhythm');

exports.getAllContent = async (req, res) => {
    try {
        const content = await Rhythm.find().sort({ createdAt: -1 });
        res.status(200).json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addContent = async (req, res) => {
    try {
        const { title, artist, category, url } = req.body;
        const newContent = new Rhythm({ title, artist, category, url });
        await newContent.save();
        res.status(201).json({ message: "Content added to Rhythm Hub", data: newContent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
