const express = require('express');
const ComplaintController = require('../controller/complaint_controller');
const ComplaintRouter = express.Router();

ComplaintRouter.post("/add-complaint", ComplaintController.addComplaint);
ComplaintRouter.get("/complaints", ComplaintController.getComplaints);
// ComplaintRouter.get("/complaint/:complaint_id", ComplaintController.getComplaint);
ComplaintRouter.delete("/complaint/:complaint_id", ComplaintController.deleteComplaint);

// ComplaintRouter.get("/complaint/:complaint_id", ComplaintController.getFullComplaintDetails);

ComplaintRouter.get("/search", ComplaintController.searchComplaints);
ComplaintRouter.get("/filter", ComplaintController.filterComplaints);

module.exports = ComplaintRouter;