const express = require("express");
const router = express.Router();

const MediaService = require("../services/MediaService");
const { uploadSingle } = require("../middlewares/upload");

router.get("/owner", async (req, res, next) => {
  try {
    const { owner_type, owner_id } = req.query;
    if (!owner_type || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "owner_type and owner_id are required",
      });
    }

    const mediaFiles = await MediaService.getByOwner(owner_type, owner_id);
    return res.json({
      success: true,
      data: { mediaFiles },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/upload", uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file received" });
    }

    const { owner_type, owner_id, is_primary } = req.body;
    const mediaFile = await MediaService.upload(
      req.file,
      owner_type,
      owner_id,
      req.user?.id || null,
      { setPrimary: is_primary === "true" }
    );

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: { mediaFile },
    });
  } catch (err) {
    console.error("UPLOAD ERROR =>", err);
    res.status(500).json({
      success: false,
      message: err.message,
      sqlMessage: err?.original?.sqlMessage,
    });
  }
});

router.get("/:id", MediaService.getFile);

module.exports = router;
