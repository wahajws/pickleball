const BaseService = require("./BaseService");
const { MediaFile } = require("../models");
const { generateUUID } = require("../utils/uuid");
const crypto = require("crypto");

class MediaService extends BaseService {
  constructor() {
    super(MediaFile);
  }

  async upload(file, ownerType, ownerId, userId, opts = {}) {
    const fileBuffer = file.buffer;
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const existing = await MediaFile.findOne({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        checksum_sha256: checksum,
        deleted_at: null,
      },
    });

    if (existing) return existing;

    const setPrimary = opts.setPrimary === true;

    if (setPrimary) {
      await MediaFile.update(
        { is_primary: false },
        {
          where: {
            owner_type: ownerType,
            owner_id: ownerId,
            deleted_at: null,
          },
        }
      );
    }

    const mediaFile = await MediaFile.create({
      id: generateUUID(),
      owner_type: ownerType,
      owner_id: ownerId,

      storage_mode: "db_blob",
      file_name: file.originalname,
      content_type: file.mimetype,
      file_ext: file.originalname.split(".").pop(),
      file_size_bytes: fileBuffer.length,
      checksum_sha256: checksum,

      blob_data: fileBuffer,

      is_primary: setPrimary ? true : false,
      sort_order: 0,
      created_by: userId,
    });

    return mediaFile;
  }

  async getByOwner(ownerType, ownerId) {
    return MediaFile.findAll({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        deleted_at: null,
      },
      order: [["is_primary", "DESC"], ["sort_order", "ASC"]],
    });
  }

  async getFile(req, res, next) {
    try {
      const media = await MediaFile.findByPk(req.params.id);
      if (!media || !media.blob_data) return res.status(404).end();

      res.setHeader("Content-Type", media.content_type || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(media.blob_data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MediaService();
