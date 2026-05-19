import { uploadFiles } from "../../middleware/upload.factory.js";

export const uploadDiscountFiles = uploadFiles({
    folder: "discount-requests",
    fields: [
        { name: "selfie_url", maxCount: 1 },
        { name: "id_url", maxCount: 1 },
    ]
});

export const getFileUrl = (folder, file) => {
  if (!file || !file.filename) return null;
  return `/uploads/${folder}/${file.filename}`;
};