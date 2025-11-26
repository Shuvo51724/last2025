import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid/non-secure";
import { getUncachableYouTubeClient, extractVideoId } from "./youtube";
import type { WSMessage, ChatUserStatus } from "@shared/schema";
import db from "./db";
import logger from "./config/logger";
import { config } from "./config/env";

const UPLOAD_DIR = config.UPLOAD_DIR;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const upload = multer({ 
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: images, videos, documents, PDFs. Received: ${file.mimetype}`));
    }
  },
});

interface WSClient extends WebSocket {
  userId?: string;
  userName?: string;
  userRole?: string;
  isAlive?: boolean;
}

const connectedUsers = new Map<string, WSClient>();
const pinnedMessages = new Set<string>();
const blockedUsers = new Set<string>();
const mutedUsers = new Set<string>();

function isAdmin(role?: string): boolean {
  return role === 'admin';
}

function isModeratorOrAdmin(role?: string): boolean {
  return role === 'admin' || role === 'moderator';
}

export async function registerRoutes(app: Express): Promise<{ httpServer: Server; wss: WebSocketServer }> {
  app.get("/api/employee-users", (_req, res) => {
    try {
      const users = db.prepare('SELECT * FROM employee_users').all();
      res.json(users);
    } catch (error) {
      logger.error("Error fetching employee users:", error);
      res.status(500).json({ error: "Failed to fetch employee users" });
    }
  });

  app.post("/api/employee-users", (req, res) => {
    try {
      const { id, name, userId, password, employeeId, createdAt } = req.body;
      const stmt = db.prepare('INSERT INTO employee_users (id, name, userId, password, employeeId, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(id, name, userId, password, employeeId, createdAt);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error creating employee user:", error);
      res.status(500).json({ error: "Failed to create employee user" });
    }
  });

  app.delete("/api/employee-users/:employeeId", (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM employee_users WHERE employeeId = ?');
      stmt.run(req.params.employeeId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting employee user:", error);
      res.status(500).json({ error: "Failed to delete employee user" });
    }
  });

  app.get("/api/attendance", (_req, res) => {
    try {
      const records = db.prepare('SELECT * FROM attendance_records ORDER BY date DESC').all();
      res.json(records);
    } catch (error) {
      logger.error("Error fetching attendance records:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/attendance", (req, res) => {
    try {
      const { id, employeeUserId, employeeName, date, checkIn, checkOut, status, remarks, createdAt } = req.body;
      const stmt = db.prepare('INSERT OR REPLACE INTO attendance_records (id, employeeUserId, employeeName, date, checkIn, checkOut, status, remarks, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(id, employeeUserId, employeeName, date, checkIn, checkOut, status, remarks, createdAt);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error saving attendance record:", error);
      res.status(500).json({ error: "Failed to save attendance record" });
    }
  });

  app.post("/api/chat/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/api/chat/files/${req.file.filename}`;
      
      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    } catch (error) {
      logger.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/chat/files/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      
      const ext = path.extname(filename).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      
      mimeType = mimeTypes[ext] || mimeType;

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", fileSize);
      res.setHeader("Accept-Ranges", "bytes");
      
      if (req.query.download === 'true') {
        res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filename)}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${path.basename(filename)}"`);
      }
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error("File download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  app.post("/api/youtube/video-info", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const youtube = await getUncachableYouTubeClient();
      const response = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const title = video.snippet?.title || "";
      const views = parseInt(video.statistics?.viewCount || "0", 10);

      res.json({ title, views });
    } catch (error) {
      logger.error("YouTube API error:", error);
      res.status(500).json({ error: "Failed to fetch video information" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WSClient) => {
    logger.info('New WebSocket connection established');
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'user_status':
            ws.userId = message.data.userId;
            ws.userName = message.data.userName;
            ws.userRole = message.data.userRole;
            connectedUsers.set(message.data.userId, ws);
            
            broadcastToAll(message);
            sendUserList(ws);
            break;

          case 'chat_message':
            if (blockedUsers.has(message.data.userId)) {
              logger.debug(`Blocked user ${message.data.userId} attempted to send message`);
              return;
            }
            if (mutedUsers.has(message.data.userId)) {
              logger.debug(`Muted user ${message.data.userId} attempted to send message`);
              return;
            }
            broadcastToOthers(message, ws);
            break;

          case 'message_read':
          case 'user_typing':
            broadcastToAll(message);
            break;

          case 'message_pinned':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to pin message`);
              return;
            }
            if (message.data.isPinned) {
              pinnedMessages.add(message.data.messageId);
            } else {
              pinnedMessages.delete(message.data.messageId);
            }
            broadcastToAll(message);
            break;

          case 'user_blocked':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to block user`);
              return;
            }
            blockedUsers.add(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_muted':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to mute user`);
              return;
            }
            mutedUsers.add(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_unblocked':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to unblock user`);
              return;
            }
            blockedUsers.delete(message.data.userId);
            broadcastToAll(message);
            break;

          case 'user_unmuted':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to unmute user`);
              return;
            }
            mutedUsers.delete(message.data.userId);
            broadcastToAll(message);
            break;

          case 'chat_cleared':
            if (!isAdmin(ws.userRole)) {
              logger.debug(`Non-admin user ${ws.userId} attempted to clear chat`);
              return;
            }
            pinnedMessages.clear();
            broadcastToAll(message);
            break;

          case 'request_user_list':
            sendUserList(ws);
            break;

          default:
            logger.debug('Unknown message type:', message);
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        connectedUsers.delete(ws.userId);
        
        const statusMessage: WSMessage = {
          type: 'user_status',
          data: {
            userId: ws.userId,
            userName: ws.userName || '',
            userRole: ws.userRole || '',
            status: 'offline',
            lastSeen: new Date().toISOString(),
          }
        };
        broadcastToAll(statusMessage);
      }
      logger.info('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WSClient) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          connectedUsers.delete(ws.userId);
        }
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  function broadcastToAll(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client: WSClient) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  function broadcastToOthers(message: WSMessage, excludeClient: WSClient) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client: WSClient) => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  function sendUserList(ws: WSClient) {
    const userList: ChatUserStatus[] = Array.from(connectedUsers.values())
      .filter(client => client.userId)
      .map(client => ({
        userId: client.userId!,
        userName: client.userName!,
        userRole: client.userRole!,
        status: 'online' as const,
        lastSeen: new Date().toISOString(),
      }));

    const message: WSMessage = {
      type: 'user_list',
      data: userList,
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  return { httpServer, wss };
}
