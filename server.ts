import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3001;

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev/preview environment
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Secure policy that allows Firebase OAuth popups
}));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'gym-tracker/browser');
  
  // Serve static files EXCEPT index.html so we can inject env vars
  app.use(express.static(distPath, { index: false }));
  
  app.get(/.*/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf8');
      
      // Inyectar variables de entorno para el frontend en producción (Coolify)
      const envScript = `<script>window.__ENV__ = { GEMINI_API_KEY: "${process.env.GEMINI_API_KEY || ''}" };</script>`;
      html = html.replace('</head>', `${envScript}</head>`);
      
      res.send(html);
    } else {
      res.status(404).send('Index file not found');
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
