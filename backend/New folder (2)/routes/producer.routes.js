const express = require("express");
const router = express.Router();
const { verifyUser, verifyAdmin } = require("../middleware/auth.middleware");
const {
    producerProfileCreate,
    producerProfileRead,
    producerProfileUpdate,
    producerProfileDelete,
    producerGetAll,
    updateProducerStatus,
    getWriters,
    getVocalists,
    getKalams,
    getSadas
} = require("../controllers/producer.controller");

// http://localhost:5000/api/producer/create-profile
router.post("/create", verifyUser, producerProfileCreate)
// http://localhost:5000/api/producer/read-profile
router.get("/read", verifyUser, producerProfileRead)
// http://localhost:5000/api/producer/update-profile
router.patch("/update", verifyUser, producerProfileUpdate)
// http://localhost:5000/api/producer/delete-profile
router.delete("/delete", verifyUser, producerProfileDelete)

// Admin
// http://localhost:5000/api/producer/get-all
router.get("/get-all", verifyUser, verifyAdmin, producerGetAll)
// http://localhost:5000/api/producer/update-status/:id
router.patch("/update-status/:id", verifyUser, verifyAdmin, updateProducerStatus)

// Producer accessing other resources
// http://localhost:5000/api/producer/writers
router.get("/writers", verifyUser, getWriters)
// http://localhost:5000/api/producer/vocalists
router.get("/vocalists", verifyUser, getVocalists)
// http://localhost:5000/api/producer/kalams
router.get("/kalams", verifyUser, getKalams)
// http://localhost:5000/api/producer/sadas
router.get("/sadas", verifyUser, getSadas)

module.exports = router;
