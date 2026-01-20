const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    description: String
});

const subscriptionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' }
});

const Plan = mongoose.model('Plan', planSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Plan, Subscription };
