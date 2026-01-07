const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_builder',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    // Use 'raw' resource_type for non-image files like PDFs
    resource_type: 'auto'
  },
});

const parser = multer({ storage: storage });

module.exports = { cloudinary, storage, parser };
