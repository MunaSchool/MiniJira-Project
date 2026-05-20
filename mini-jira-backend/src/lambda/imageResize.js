const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

const sharp = require('sharp');

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

exports.handler = async (event) => {
  try {

    for (const record of event.Records) {

      const bucket = record.s3.bucket.name;

      const key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' ')
      );

      console.log('Processing image:', key);

      // Get original image
      const originalImage = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );

      // Convert stream to buffer
      const chunks = [];

      for await (const chunk of originalImage.Body) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Resize image
      const resizedBuffer = await sharp(buffer)
        .resize({
          width: 300,
          height: 300,
          fit: 'inside'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload resized version
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_RESIZED_BUCKET,
          Key: key,
          Body: resizedBuffer,
          ContentType: 'image/jpeg'
        })
      );

      console.log('Thumbnail created successfully');
    }

    return {
      statusCode: 200,
      body: 'Images processed successfully'
    };

  } catch (error) {
    console.error('Resize Lambda Error:', error);

    throw error;
  }
};