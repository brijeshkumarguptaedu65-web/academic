const { Plan, Subscription } = require('../models/Subscription');

const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({});
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const createPlan = async (req, res) => {
    try {
        const plan = await Plan.create(req.body);
        res.status(201).json(plan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const subscribe = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        const subscription = await Subscription.create({
            studentId: req.user._id,
            planId,
            startDate,
            endDate,
            status: 'ACTIVE'
        });

        res.json(subscription);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const getRevenue = async (req, res) => {
    // Mock revenue. In real app, sum payments.
    // Query subscriptions, join plan, sum price.
    try {
        const subscriptions = await Subscription.find({}).populate('planId');
        const revenue = subscriptions.reduce((acc, sub) => acc + (sub.planId ? sub.planId.price : 0), 0);
        res.json({ totalRevenue: revenue });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getPlans, createPlan, subscribe, getRevenue };
