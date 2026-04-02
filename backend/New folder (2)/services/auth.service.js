const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/otp");
const { sendOTPEmail, passwordResetOTPEmail } = require("../utils/mailer");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");

exports.registerUser = async (full_name, email, password) => {
    const client = await pool.connect();
    try {
        const userExists = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (userExists.rows.length > 0) {
            throw new Error("Email already registered");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // insert user
        await client.query(
            `INSERT INTO users (full_name, email,password,otp_code,otp_expires_at,role) VALUES ($1,$2,$3,$4,$5,$6)`,
            [full_name, email, hashedPassword, otp, otpExpiry, "user"]
        );

        await sendOTPEmail(email, otp);
        return { message: "Sign up Successfull. Verify OTP sent to email." }
    } catch (error) {
        console.log(error)
        throw error
    }
    finally {
        client.release()
    }
}

exports.verifyOTP = async (email, otp) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            "SELECT * FROM users WHERE email=$1", [email]
        )
        if (result.rows.length === 0) {
            throw new Error("User not found!");
        }
        // if email already exists
        const user = result.rows[0]
        if (user.is_verified) {
            return { message: "Already verified" }
        }
        console.log(user)
        if (user.otp_code !== otp) {
            throw new Error("Invalid OTP");
        }
        // checks if OTP expired
        const otpExpiry = Date.parse(user.otp_expires_at)
        if (new Date() > otpExpiry) {
            throw new Error("OTP expired")
        }
        await client.query(
            `UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE email = $1`, [email]
        );
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        await client.query(
            "UPDATE users SET refresh_token=$1 WHERE id=$2",
            [refreshToken, user.id]
        )
        return { message: "Email verified!", accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw error;
    }
    finally {
        client.release();
    }
}

exports.loginService = async (email, password) => {
    const client = await pool.connect()
    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE email=$1", [email]
        )
        const user = userResult.rows[0]
        console.log(password)
        if (!user) throw new Error("Invalid Email!")
        const userValid = await bcrypt.compare(password, user.password)
        console.log(userValid)
        if (!userValid) throw new Error("Invalid Password")
        console.log(user.is_verified)
        if (user.is_verified) {
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)
            await client.query(
                "UPDATE users SET refresh_token=$1 WHERE id=$2",
                [refreshToken, user.id]
            );
            return { message: "Login successfull!", accessToken, refreshToken }
        }
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        // insert user
        await client.query(
            `UPDATE users SET otp_code=$1,otp_expires_at=$2 WHERE email=$3`,
            [otp, otpExpiry, email]
        );

        await sendOTPEmail(email, otp);
        return { message: "Please verify your email!" }

    } catch (error) {
        console.log("loginService", error)
        throw error
    }
    finally {
        client.release()
    }

}

exports.refreshTokenService = async (refreshToken) => {
    const client = await pool.connect()
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        if (!decoded) {
            throw new Error("Invalid Refresh Token")
        }
        const userResult = await client.query(
            "SELECT * FROM users WHERE id=$1 AND refresh_token=$2", [decoded.id, refreshToken]
        )
        const user = userResult.rows[0];
        if (!user) throw Error("Invalid token!")
        // const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);
        // Check remaining time
        const expiresIn = decoded.exp * 1000 - Date.now();
        // Only refresh if token expires in less than e.g., 1 day
        if (expiresIn < 24 * 60 * 60 * 1000) {
            const newRefreshToken = generateRefreshToken(user);
            const newAccessToken = generateAccessToken(user);
            await client.query(
                "UPDATE users SET refresh_token=$1 WHERE id=$2",
                [newRefreshToken, user.id]
            );
            return { id: user.id, role: user.role, full_name: user.full_name, message: "Token granted!", newRefreshToken, newAccessToken }
            // return { newRefreshToken };
        }
        const newRefreshToken = refreshToken
        // return { newRefreshToken: oldToken };
        return { message: "Token still Valid!", newRefreshToken }
        // Otherwise, return old token
    } catch (error) {
        console.log("refreshTokenService", error)
        throw error
    }
    finally {
        client.release()
    }
}

exports.logoutService = async (refreshToken) => {
    const client = await pool.connect()
    try {
        await client.query(
            "UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [refreshToken]
        )
        return { message: "User logout successfully!" }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        client.release()
    }
}

exports.resetPasswordSendOtpService = async (email) => {
    const client = await pool.connect()
    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE email=$1", [email]
        )
        const user = userResult.rows[0]
        if (!user) throw new Error("User does not exist!")
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await client.query(
            "UPDATE users SET otp_code=$1, otp_expires_at=$2 WHERE email=$3", [otp, otpExpiry, email]
        )
        await passwordResetOTPEmail(email, otp)
        return { message: "OTP sent to email!" }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        client.release()
    }
}

exports.resetPasswordVerifyOtpService = async (email, otp) => {
    const client = await pool.connect()
    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE email=$1", [email]
        )
        const user = userResult.rows[0]
        if (!user) throw new Error("User does not exist!")
        if (otp !== user.otp_code) {
            throw new Error("Invalid OTP");
        }
        const otpExpiry = Date.parse(user.otp_expires_at)
        if (new Date() > otpExpiry) throw new Error("OTP expired!");
        const tempToken = jwt.sign(
            { id: user.id, purpose: "reset_password" },
            process.env.JWT_TEMP_SECRET,
            { expiresIn: "10m" }
        );
        return { message: "OTP verified!", tempToken }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        client.release()
    }
}

exports.resetPasswordViaOtpService = async (email, password, tempToken) => {
    const client = await pool.connect()
    try {
        const userResult = await client.query(
            "SELECT * FROM users WHERE email=$1", [email]
        )
        const user = userResult.rows[0]
        if (!user) throw new Error("User does not exist!")
        const payload = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET)
        if (!payload) throw new Error("Invalid Token")
        const userId = payload.id
        const hashedPassword = await bcrypt.hash(password, 10)
        await client.query(
            `UPDATE users 
             SET password = $1,
             otp_code = NULL,
             otp_expires_at = NULL,
             updated_at = NOW(),
             refresh_token = NULL 
             WHERE id=$2
            `, [hashedPassword, userId]
        )
        return { message: "Password successfully reset. Please login again." };
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        client.release()
    }
}

exports.updateProfileService = async (userId, full_name, password, profile_photo) => {
    const client = await pool.connect();
    try {
        // Ensure profile_photo column exists safely
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;`);

        const userResult = await client.query("SELECT * FROM users WHERE id=$1", [userId]);
        const user = userResult.rows[0];
        if (!user) {
            throw new Error("User not found!");
        }

        let updateQuery = "UPDATE users SET full_name = $1, profile_photo = $2, updated_at = NOW()";
        let queryParams = [full_name || user.full_name, profile_photo !== undefined ? profile_photo : user.profile_photo];
        let paramIndex = 3;

        // If password is provided, explicitly update it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += `, password = $${paramIndex}`;
            queryParams.push(hashedPassword);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING id, full_name, email, profile_photo, role`;
        queryParams.push(userId);

        const updatedResult = await client.query(updateQuery, queryParams);
        return { message: "Profile updated successfully!", user: updatedResult.rows[0] };
    } catch (error) {
        console.log("updateProfileService", error);
        throw error;
    } finally {
        client.release();
    }
};