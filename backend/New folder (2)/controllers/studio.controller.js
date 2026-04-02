const { sanitizeInput } = require("../utils/sanitize");
const studioService = require("../services/studio.service");

exports.profileCreate = async (req, res) => {
    try {
        const {
            studio_name,
            country,
            city,
            primary_contact_name,
            email,
            phone,
            years_in_operation,
            previous_work_link,
            agree_centralized_validation,
            agree_centralized_authorization,
            recording_capabilities,
            equipment_overview,
            accept_terms
        } = sanitizeInput(req.body);
        
        const user_id = req.user.id;
        
        const result = await studioService.studioCreateService(
            studio_name,
            country,
            city,
            primary_contact_name,
            email,
            phone,
            years_in_operation,
            previous_work_link,
            agree_centralized_validation,
            agree_centralized_authorization,
            recording_capabilities,
            equipment_overview,
            accept_terms,
            user_id
        );
        res.status(200).json(result.message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.profileRead = async (req, res) => {
    try {
        const user_id = req.user.id;
        const profile = await studioService.studioReadService(user_id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.profileUpdate = async (req, res) => {
    try {
        const user_id = req.user.id;
        const updateData = sanitizeInput(req.body);
        const result = await studioService.studioUpdateService(user_id, updateData);
        res.status(200).json({ message: result.message, profile: result.profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const studio_id = req.params.id;
        const { status } = req.body;

        const result = await studioService.updateStudioStatusService(studio_id, status);

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.profileDelete = async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await studioService.studioDeleteService(user_id);
        res.status(200).json({ message: result.message });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const user_role = req.user.role;
        if (user_role === "admin" || user_role === "super admin") {
            const result = await studioService.getAllStudios();
            res.status(200).json({ message: result.message, studios: result.studios });
        } else {
            res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
