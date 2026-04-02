const pool = require("../config/db");

exports.studioCreateService = async (
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
) => {
    const client = await pool.connect();
    try {
        const profileExists = await client.query(
            "SELECT * FROM studio_profiles WHERE user_id=$1",
            [user_id]
        );
        if (profileExists.rows.length > 0) {
            throw new Error("Profile already exists");
        }
        await client.query(
            `INSERT INTO studio_profiles(
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
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )`,
            [
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
            ]
        );
        return { message: "Studio Profile Submitted! Please wait for approval" };
    } catch (error) {
        console.log("studioCreateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.studioReadService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM studio_profiles WHERE user_id=$1",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found");
        }

        return result.rows[0];
    } catch (error) {
        console.log("studioReadService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.studioUpdateService = async (
    user_id,
    {
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
    }
) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE studio_profiles
             SET 
                 studio_name=$1,
                 country=$2,
                 city=$3,
                 primary_contact_name=$4,
                 email=$5,
                 phone=$6,
                 years_in_operation=$7,
                 previous_work_link=$8,
                 agree_centralized_validation=$9,
                 agree_centralized_authorization=$10,
                 recording_capabilities=$11,
                 equipment_overview=$12,
                 accept_terms=$13,
                 updated_at=NOW()
             WHERE user_id=$14
             RETURNING *`,
            [
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
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or not updated");
        }

        return { message: "Studio Profile Updated Successfully", profile: result.rows[0] };
    } catch (error) {
        console.log("studioUpdateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.updateStudioStatusService = async (studio_id, newStatus) => {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `UPDATE studio_profiles
             SET
                profile_status = $1,
                updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newStatus, studio_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Studio not found");
        }

        return {
            message: "Studio status updated successfully",
            studio: result.rows[0]
        };

    } catch (error) {
        console.log("updateStudioStatus", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.studioDeleteService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "DELETE FROM studio_profiles WHERE user_id=$1 RETURNING *",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or already deleted");
        }

        return { message: "Studio Profile Deleted Successfully" };
    } catch (error) {
        console.log("studioDeleteService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.getAllStudios = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM studio_profiles ORDER BY created_at DESC`
        );
        if(result.rowCount === 0){
            return {message:"No studios yet"};
        }
        return { message:"Studio Profiles Fetched!", studios: result.rows };
    } catch (err) {
        console.log("getAllStudios", err);
        throw err;
    } finally {
        client.release();
    }
};
