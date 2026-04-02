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
} = require("../controllers/studio.controller");

// http://localhost:5000/api/studio/create
router.post("/create", verifyUser, profileCreate)
// http://localhost:5000/api/studio/read
router.get("/read", verifyUser, profileRead)
// http://localhost:5000/api/studio/update
router.patch("/update", verifyUser, profileUpdate)
// http://localhost:5000/api/studio/delete
router.delete("/delete", verifyUser, profileDelete)

// Admin
// http://localhost:5000/api/studio/get-all
router.get("/get-all", verifyUser, verifyAdmin, getAll)
// http://localhost:5000/api/studio/update-status/:id
router.patch("/update-status/:id", verifyUser, verifyAdmin, updateStatus)

module.exports = router;
