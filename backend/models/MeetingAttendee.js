const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, trim: true, lowercase: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['host', 'required', 'optional'], default: 'required' },
  responseStatus: { type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' },
  attended: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.MeetingAttendee || mongoose.model('MeetingAttendee', schema);
