const { sanitizeInput } = require("../utils/sanitize");
const producerService = require("../services/producer.service");

exports.producerProfileCreate = async (req, res) => {
    try {
        const {
            full_name,
            professional_name,
            country,
            city,
            email,
            years_experience,
            primary_production_focus,
            primary_tools,
            musical_background,
            portfolio_link,
            worked_structured_production,
            willing_defined_sequence,
            acknowledge_centralized_control,
            accept_framework
        } = sanitizeInput(req.body);
        
        const user_id = req.user.id;
        
        const result = await producerService.producerProfileCreateService(
            full_name,
            professional_name,
            country,
            city,
            email,
            years_experience,
            primary_production_focus,
            primary_tools,
            musical_background,
            portfolio_link,
            worked_structured_production,
            willing_defined_sequence,
            acknowledge_centralized_control,
            accept_framework,
            user_id
        );
        res.status(200).json(result.message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.producerProfileRead = async (req, res) => {
    try {
        const user_id = req.user.id;
        const profile = await producerService.producerProfileReadService(user_id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.producerProfileUpdate = async (req, res) => {
    try {
        const user_id = req.user.id;
        const updateData = sanitizeInput(req.body);
        const result = await producerService.producerProfileUpdateService(user_id, updateData);
        res.status(200).json({ message: result.message, profile: result.profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateProducerStatus = async (req, res) => {
    try {
        const producer_id = req.params.id;
        const { status } = req.body;

        const result = await producerService.updateProducerStatusService(producer_id, status);

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.producerProfileDelete = async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await producerService.producerProfileDeleteService(user_id);
        res.status(200).json({ message: result.message });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.producerGetAll = async (req, res) => {
    try {
        const user_role = req.user.role;
        if (user_role === "admin" || user_role === "super admin") {
            const result = await producerService.getAllProducers();
            res.status(200).json({ message: result.message, producers: result.producers });
        } else {
            res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Endpoints for Producer to view other resources

exports.getWriters = async (req, res) => {
    try {
        // verify producer
        const profile = await producerService.producerProfileReadService(req.user.id);
        if (!profile || profile.profile_status !== 'approved') {
            return res.status(403).json({ error: "Only approved producers can view writers." });
        }
        
        const result = await producerService.getWritersForProducer();
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getVocalists = async (req, res) => {
    try {
        const profile = await producerService.producerProfileReadService(req.user.id);
        if (!profile || profile.profile_status !== 'approved') {
            return res.status(403).json({ error: "Only approved producers can view vocalists." });
        }
        
        const result = await producerService.getVocalistsForProducer();
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getKalams = async (req, res) => {
    try {
        const profile = await producerService.producerProfileReadService(req.user.id);
        if (!profile || profile.profile_status !== 'approved') {
            return res.status(403).json({ error: "Only approved producers can view kalams." });
        }
        
        const result = await producerService.getKalamsForProducer();
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getSadas = async (req, res) => {
    try {
        const profile = await producerService.producerProfileReadService(req.user.id);
        if (!profile || profile.profile_status !== 'approved') {
            return res.status(403).json({ error: "Only approved producers can view sadas." });
        }
        
        const result = await producerService.getSadasForProducer();
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
