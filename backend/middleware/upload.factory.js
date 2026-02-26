import multer from "multer";
import path from "path";
import fs from "fs";   

const ensureFolder = (folderPath) => {
    if(!fs.existsSync(folderPath)) {
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
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + ext);
        },
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        if(!allowedTypes.includes(file.mimetype)) {
            cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."), false);
        } else {
            cb(null, true);
        }
    }

    const upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 100 * 1024 * 1024 } // 5MB limit
    });

    return upload.fields(fields);
}