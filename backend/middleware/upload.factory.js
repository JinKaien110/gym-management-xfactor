import multer from "multer";
import path from "path";
import fs from "fs";

const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export const uploadFiles = ({ folder = "general", fields = [] }) => {
  const basePath = path.join(process.cwd(), "uploads", folder);
  ensureFolder(basePath);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, basePath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + ext);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."),
        false
      );
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // ✅ fixed: 5MB (your comment was wrong before)
  });

  // 🔥 IMPORTANT: return middleware chain, not just multer
  return [
    upload.fields(fields),

    // ✅ Attach clean URLs after upload
    (req, res, next) => {
      if (!req.files) return next();

      req.fileUrls = {};

      Object.keys(req.files).forEach((field) => {
        const fileArray = req.files[field];

        if (!fileArray || fileArray.length === 0) {
          req.fileUrls[field] = null;
          return;
        }

        // handle single file (maxCount: 1)
        if (fileArray.length === 1) {
          const file = fileArray[0];
          req.fileUrls[field] = `/uploads/${folder}/${file.filename}`;
        } else {
          // handle multiple files
          req.fileUrls[field] = fileArray.map(
            (file) => `/uploads/${folder}/${file.filename}`
          );
        }
      });

      next();
    },
  ];
};