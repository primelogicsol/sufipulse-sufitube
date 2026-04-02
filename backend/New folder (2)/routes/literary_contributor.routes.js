const express = require("express");
const router = express.Router();
const { verifyUser, verifyAdmin } = require("../middleware/auth.middleware");
const { 
    profileCreate, 
    profileRead, 
    profileUpdate, 
    profileDelete, 
    getAll, 
    updateStatus
} = require("../controllers/literary_contributor.controller");

// http://localhost:5000/api/literary-contributor/create
router.post("/create", verifyUser, profileCreate)
// http://localhost:5000/api/literary-contributor/read
router.get("/read", verifyUser, profileRead)
// http://localhost:5000/api/literary-contributor/update
router.patch("/update", verifyUser, profileUpdate)
// http://localhost:5000/api/literary-contributor/delete
router.delete("/delete", verifyUser, profileDelete)

// Admin
// http://localhost:5000/api/literary-contributor/get-all
router.get("/get-all", verifyUser, verifyAdmin, getAll)
// http://localhost:5000/api/literary-contributor/update-status/:id
router.patch("/update-status/:id", verifyUser, verifyAdmin, updateStatus)

module.exports = router;
