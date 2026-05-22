const {
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('./aws');

const UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET;

async function generateUploadUrl({ key, contentType }) {
  const command = new PutObjectCommand({
    Bucket: UPLOAD_BUCKET,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300 // 5 minutes
  });

  return uploadUrl;
}

async function deleteImage(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: key
    })
  );
}

async function deleteResizedImage(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_RESIZED_BUCKET,
      Key: `resized-${key}`
    })
  );
}



module.exports = {
  generateUploadUrl,
  deleteImage,
  deleteResizedImage
};