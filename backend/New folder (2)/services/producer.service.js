const pool = require("../config/db");

exports.producerProfileCreateService = async (
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
) => {
    const client = await pool.connect();
    try {
        const profileExists = await client.query(
            "SELECT * FROM producer_profiles WHERE user_id=$1",
            [user_id]
        );
        if (profileExists.rows.length > 0) {
            throw new Error("Profile already exists");
        }
        const result = await client.query(
            `INSERT INTO producer_profiles(
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
                primary_production_focus,
                primary_tools,
                musical_background,
                portfolio_link,
                worked_structured_production,
                willing_defined_sequence,
                acknowledge_centralized_control,
                accept_framework,
                user_id
            ]
        );
        return { message: "Producer Profile Submitted! Please wait for approval" };
    } catch (error) {
        console.log("producerProfileCreateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.producerProfileReadService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM producer_profiles WHERE user_id=$1",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found");
        }

        return result.rows[0];
    } catch (error) {
        console.log("producerProfileReadService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.producerProfileUpdateService = async (
    user_id,
    {
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
    }
) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE producer_profiles
             SET 
                 full_name=$1,
                 professional_name=$2,
                 country=$3,
                 city=$4,
                 email=$5,
                 years_experience=$6,
                 primary_production_focus=$7,
                 primary_tools=$8,
                 musical_background=$9,
                 portfolio_link=$10,
                 worked_structured_production=$11,
                 willing_defined_sequence=$12,
                 acknowledge_centralized_control=$13,
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
                primary_production_focus,
                primary_tools,
                musical_background,
                portfolio_link,
                worked_structured_production,
                willing_defined_sequence,
                acknowledge_centralized_control,
                accept_framework,
                user_id
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or not updated");
        }

        return { message: "Producer Profile Updated Successfully", profile: result.rows[0] };
    } catch (error) {
        console.log("producerProfileUpdateService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.updateProducerStatusService = async (producer_id, newStatus) => {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `UPDATE producer_profiles
             SET
                profile_status = $1,
                updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newStatus, producer_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Producer not found");
        }

        return {
            message: "Producer status updated successfully",
            producer: result.rows[0]
        };

    } catch (error) {
        console.log("updateProducerStatus", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.producerProfileDeleteService = async (user_id) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "DELETE FROM producer_profiles WHERE user_id=$1 RETURNING *",
            [user_id]
        );

        if (result.rows.length === 0) {
            throw new Error("Profile not found or already deleted");
        }

        return { message: "Producer Profile Deleted Successfully" };
    } catch (error) {
        console.log("producerProfileDeleteService", error);
        throw error;
    } finally {
        client.release();
    }
};

exports.getAllProducers = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM producer_profiles ORDER BY created_at DESC`
        );
        if(result.rowCount === 0){
            return {message:"No producers yet"};
        }
        return { message:"Producer Profiles Fetched!", producers: result.rows };
    } catch (err) {
        console.log("getAllProducers", err);
        throw err;
    } finally {
        client.release();
    }
};

// Functions to fetch other resources for producers
exports.getWritersForProducer = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM writer_profiles ORDER BY created_at DESC");
        return { writers: result.rows };
    } catch (err) {
        console.log("getWritersForProducer", err);
        throw err;
    } finally {
        client.release();
    }
};

exports.getVocalistsForProducer = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM vocalist_profiles ORDER BY created_at DESC");
        return { vocalists: result.rows };
    } catch (err) {
        console.log("getVocalistsForProducer", err);
        throw err;
    } finally {
        client.release();
    }
};

exports.getKalamsForProducer = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM kalams ORDER BY created_at DESC");
        return { kalams: result.rows };
    } catch (err) {
        console.log("getKalamsForProducer", err);
        throw err;
    } finally {
        client.release();
    }
};

exports.getSadasForProducer = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM sadas ORDER BY created_at DESC");
        return { sadas: result.rows };
    } catch (err) {
        console.log("getSadasForProducer", err);
        throw err;
    } finally {
        client.release();
    }
};
