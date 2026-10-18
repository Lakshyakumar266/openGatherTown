import sharp from "sharp";

const src = "public/opengather-keyart.png";
const outputs = ["public/og.png", "public/project-cover.png"];
const W = 1200;
const H = 630;

const result = sharp(src)
  .resize(W, H, { fit: "cover", position: "centre" })
  .png({ compressionLevel: 8 });

for (const output of outputs) {
  await result.clone().toFile(output);
}

const meta = await sharp(outputs[0]).metadata();
console.log(meta);
