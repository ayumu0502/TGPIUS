import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ref = path.join(
  root,
  "..",
  ".cursor",
  "projects",
  "c-Users-tgplu-tgplus",
  "assets",
  "c__Users_tgplu_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_2026_7_8__16_30_45-111ffd58-fd3b-4f91-aa60-977614dac130.png",
);
const out = path.join(root, "public", "landing");

const crops = [
  { name: "ref-hero-collage.jpg", left: 248, top: 72, width: 420, height: 360 },
  { name: "ref-support-1.jpg", left: 36, top: 828, width: 148, height: 118 },
  { name: "ref-support-2.jpg", left: 188, top: 828, width: 148, height: 118 },
  { name: "ref-support-3.jpg", left: 340, top: 828, width: 148, height: 118 },
  { name: "ref-support-4.jpg", left: 492, top: 828, width: 148, height: 118 },
];

for (const crop of crops) {
  await sharp(ref)
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .jpeg({ quality: 92 })
    .toFile(path.join(out, crop.name));
  console.log("wrote", crop.name);
}
