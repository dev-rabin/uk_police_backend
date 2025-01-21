const express = require('express');
const ComplaintDetailsController = require('../controller/complaint_details');
const ComplaintDetailRouter = express.Router();

ComplaintDetailRouter.post("/add-complaint-detail", ComplaintDetailsController.addComplaintDetails);
ComplaintDetailRouter.get("/complaint/:complaint_id", ComplaintDetailsController.getFullComplaintDetails);


module.exports = ComplaintDetailRouter;