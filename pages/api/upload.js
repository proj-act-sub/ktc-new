import nextConnect from 'next-connect';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'_')),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed!'), false)
    cb(null, true)
  }
})

const apiRoute = nextConnect({
  onError(error, req, res) { res.status(500).json({ error: `Upload error: ${error.message}` }) },
  onNoMatch(req, res) { res.status(405).json({ error: `Method ${req.method} not allowed` }) }
})

apiRoute.use(upload.single('file'))
apiRoute.post((req, res) => {
  const file = req.file
  const publicUrl = `/uploads/${file.filename}`
  res.status(201).json({ url: publicUrl })
})

export default apiRoute
export const config = { api: { bodyParser: false } }
