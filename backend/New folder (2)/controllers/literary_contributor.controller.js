const { sanitizeInput } = require("../utils/sanitize");
const literaryContributorService = require("../services/literary_contributor.service");

exports.profileCreate = async (req, res) => {
    try {
        const {
            full_name,
            professional_name,
            country,
            city,
            email,
            years_experience,
            writing_focus,
            languages,
            background,
            portfolio_link,
            worked_editorial_process,
            willing_review_process,
            acknowledge_editorial_control,
            accept_framework
        } = sanitizeInput(req.body);
        
        const user_id = req.user.id;
        
        const result = await literaryContributorService.literaryContributorCreateService(
            full_name,
            professional_name,
            country,
            city,
            email,
            years_experience,
            writing_focus,
            languages,
            background,
            portfolio_link,
            worked_editorial_process,
            willing_review_process,
            acknowledge_editorial_control,
            accept_framework,
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
        const profile = await literaryContributorService.literaryContributorReadService(user_id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.profileUpdate = async (req, res) => {
    try {
        const user_id = req.user.id;
        const updateData = sanitizeInput(req.body);
        const result = await literaryContributorService.literaryContributorUpdateService(user_id, updateData);
        res.status(200).json({ message: result.message, profile: result.profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const contributor_id = req.params.id;
        const { status } = req.body;

        const result = await literaryContributorService.updateLiteraryContributorStatusService(contributor_id, status);

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.profileDelete = async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await literaryContributorService.literaryContributorDeleteService(user_id);
        res.status(200).json({ message: result.message });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const user_role = req.user.role;
        if (user_role === "admin" || user_role === "super admin") {
            const result = await literaryContributorService.getAllLiteraryContributors();
            res.status(200).json({ message: result.message, contributors: result.contributors });
        } else {
            res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
