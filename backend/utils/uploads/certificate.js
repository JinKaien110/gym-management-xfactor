import { uploadFiles } from "../../middleware/upload.factory.js";

export const uploadCertificationFiles = uploadFiles({
    folder: "trainer-certification",
    fields: [
        { name: "certification_file", maxCount: 3 },
    ]
});

export const getFileUrl = (folder, file) => {
  if (!file || !file.filename) return null;
  return `/uploads/${folder}/${file.filename}`;
};