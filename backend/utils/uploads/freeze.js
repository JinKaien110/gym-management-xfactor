import { uploadFiles } from "../../middleware/upload.factory.js";

export const uploadFreezeFiles = uploadFiles({
    folder: "freeze-requests",
    fields: [
        { name: "medical_proof_url", maxCount: 1 },
    ]
});

export const getFileUrl = (folder, file) => {
  if (!file || !file.filename) return null;
  return `/uploads/${folder}/${file.filename}`;
};