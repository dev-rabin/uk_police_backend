const express = require("express");
const ImageController = require("../controller/image_controller");
const ImageRouter = express.Router();
const upload = require("../middleware/multer")

ImageRouter.post("/add-image",upload.array("url", 5), ImageController.addImage);


module.exports = ImageRouter;