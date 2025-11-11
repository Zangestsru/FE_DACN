import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Ports for each app's Vite dev server
const MAIN_PORT = process.env.MAIN_PORT ? Number(process.env.MAIN_PORT) : 3000; // Online Exam Website Interface
const ADMIN_PORT = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 3002; // TailAdmin
const TEACHER_PORT = process.env.TEACHER_PORT ? Number(process.env.TEACHER_PORT) : 3003; // Teacher

// Gateway port (single port exposed to users)
const GATEWAY_PORT = process.env.GATEWAY_PORT ? Number(process.env.GATEWAY_PORT) : 4000;

const app = express();

// Helpful logs
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url}`);
  next();
});

// Proxy /admin -> TailAdmin
app.use(
  '/admin',
  createProxyMiddleware({
    target: `http://localhost:${ADMIN_PORT}`,
    changeOrigin: true,
    ws: true,
    // Do NOT rewrite the path; TailAdmin is served under base '/admin/'
  })
);

// Proxy /teacher -> Teacher
app.use(
  '/teacher',
  createProxyMiddleware({
    target: `http://localhost:${TEACHER_PORT}`,
    changeOrigin: true,
    ws: true,
    // Do NOT rewrite the path; Teacher is served under base '/teacher/'
  })
);

// Proxy root and everything else to the main app
app.use(
  '/',
  createProxyMiddleware({
    target: `http://localhost:${MAIN_PORT}`,
    changeOrigin: true,
    ws: true,
  })
);

app.listen(GATEWAY_PORT, () => {
  console.log(
    `Gateway running on http://localhost:${GATEWAY_PORT} -> / (main:${MAIN_PORT}) | /admin (admin:${ADMIN_PORT}) | /teacher (teacher:${TEACHER_PORT})`
  );
});