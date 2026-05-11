const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  givenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  givenTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  qualityRating: Number, timelinessRating: Number, communicationRating: Number,
  comment: String
}, { timestamps: false });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', schema);
