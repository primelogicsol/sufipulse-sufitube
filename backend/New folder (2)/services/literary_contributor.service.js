const pool = require("../config/db");

exports.literaryContributorCreateService = async (
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
) => {
    const client = await pool.connect();
    try {
        const profileExists = await client.query(
            "SELECT * FROM literary_contributor_profiles WHERE user_id=$1",
            [user_id]
        );
        if (profileExists.rows.length > 0) {
            throw new Error("Profile already exists");
        }
        await client.query(
            `INSERT INTO literary_contributor_profiles(
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
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )`,
            [
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
            ]
        );
        return { message: "Literary Contributor Profile Submitted! Please wait for approval" };
    } catch (error) {
        console.log("literaryContributorCreateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.literaryContributorReadService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM literary_contributor_profiles WHERE user_id=$1",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found");
        }

        return result.rows[0];
    } catch (error) {
        console.log("literaryContributorReadService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.literaryContributorUpdateService = async (
    user_id,
    {
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
    }
) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE literary_contributor_profiles
             SET 
                 full_name=$1,
                 professional_name=$2,
                 country=$3,
                 city=$4,
                 email=$5,
                 years_experience=$6,
                 writing_focus=$7,
                 languages=$8,
                 background=$9,
                 portfolio_link=$10,
                 worked_editorial_process=$11,
                 willing_review_process=$12,
                 acknowledge_editorial_control=$13,
                 accept_framework=$14,
                 updated_at=NOW()
             WHERE user_id=$15
             RETURNING *`,
            [
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
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or not updated");
        }

        return { message: "Literary Contributor Profile Updated Successfully", profile: result.rows[0] };
    } catch (error) {
        console.log("literaryContributorUpdateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.updateLiteraryContributorStatusService = async (contributor_id, newStatus) => {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `UPDATE literary_contributor_profiles
             SET
                profile_status = $1,
                updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newStatus, contributor_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Literary Contributor not found");
        }

        return {
            message: "Literary Contributor status updated successfully",
            contributor: result.rows[0]
        };

    } catch (error) {
        console.log("updateLiteraryContributorStatus", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.literaryContributorDeleteService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "DELETE FROM literary_contributor_profiles WHERE user_id=$1 RETURNING *",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or already deleted");
        }

        return { message: "Literary Contributor Profile Deleted Successfully" };
    } catch (error) {
        console.log("literaryContributorDeleteService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.getAllLiteraryContributors = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM literary_contributor_profiles ORDER BY created_at DESC`
        );
        if(result.rowCount === 0){
            return {message:"No literary contributors yet"};
        }
        return { message:"Literary Contributor Profiles Fetched!", contributors: result.rows };
    } catch (err) {
        console.log("getAllLiteraryContributors", err);
        throw err;
    } finally {
        client.release();
    }
};
