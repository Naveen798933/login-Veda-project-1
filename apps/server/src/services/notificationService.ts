import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const REDIS_URL = process.env.REDIS_URI || 'redis://localhost:6379';

/**
 * Initialize Redis connection for BullMQ
 */
const initializeRedisConnection = (): IORedis => {
  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      return times > 1 ? null : 1000;
    }
  });

  connection.on('error', (err) => {
    console.error('⚠️ Redis Connection Error:', err.message);
  });

  connection.on('ready', () => {
    console.log('✅ Redis Connection Ready');
  });

  return connection;
};

const redisConnection = initializeRedisConnection();

/**
 * Create email transporter based on environment
 */
const createTransporter = async (): Promise<Transporter> => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: Use real SMTP configuration
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_TLS === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: process.env.SMTP_FROM || 'noreply@logicveda.com'
    });

    // Verify connection
    try {
      await transport.verify();
      console.log('✅ Production SMTP Configured and Verified');
    } catch (err: unknown) {
      console.error('❌ SMTP Configuration Error:', err instanceof Error ? err.message : err);
      console.warn('⚠️ Falling back to Ethereal test account');
      return createEtherealTransporter();
    }

    return transport;
  } else {
    // Development: Use Ethereal test account
    return createEtherealTransporter();
  }
};

/**
 * Create Ethereal test transporter for development
 */
const createEtherealTransporter = async (): Promise<Transporter> => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

let transporter: Transporter;
let socketIO: SocketIOServer | null = null;

// Initialize transporter on module load
createTransporter().then(t => {
  transporter = t;
  console.log('📬 Email Transporter Initialized');
});

/**
 * Create the notification queue
 */
export const notificationQueue = new Queue('notifications', { connection: redisConnection });

/**
 * Set Socket.IO instance for real-time notifications
 */
export const setSocketIO = (io: SocketIOServer) => {
  socketIO = io;
};

/**
 * Notification data interface
 */
export interface NotificationData {
  userId: string;
  email?: string;
  type: 'COMMENT' | 'SHARE' | 'SYSTEM' | 'PASSWORD_RESET' | 'MENTION' | 'DOCUMENT_SHARED';
  title?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Queue a notification job
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
  try {
    if (redisConnection.status === 'ready') {
      await notificationQueue.add('send-notification', data, {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        priority: data.type === 'PASSWORD_RESET' ? 10 : 1, // Higher priority for password reset
      });
      console.log(`✅ Notification queued: [${data.type}] for user ${data.userId}`);
    } else {
      console.warn('⚠️ Redis not available. Notification logged:', data.message);
    }
  } catch (err: unknown) {
    console.error('❌ Failed to queue notification:', err instanceof Error ? err.message : err);
  }
};

/**
 * Email template builders
 */
const getEmailTemplate = (type: string, message: string, metadata?: Record<string, unknown>) => {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f5f5f5; padding: 20px; }
      .footer { background: #333; color: #999; padding: 10px; text-align: center; font-size: 12px; }
      .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    </style>
  `;

  const templates: Record<string, string> = {
    PASSWORD_RESET: `
      <div class="container">
        <div class="header"><h2>Password Reset Request</h2></div>
        <div class="content">
          <p>You requested a password reset for your LogicVeda account.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          ${message}
          <p><strong>Don't recognize this request?</strong> Ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    `,
    COMMENT: `
      <div class="container">
        <div class="header"><h2>New Comment on Your Document</h2></div>
        <div class="content">
          <p>${message}</p>
          <a href="${metadata?.documentUrl || '#'}" class="button">View Comment</a>
        </div>
      </div>
    `,
    MENTION: `
      <div class="container">
        <div class="header"><h2>You Were Mentioned</h2></div>
        <div class="content">
          <p>${message}</p>
          <a href="${metadata?.documentUrl || '#'}" class="button">View Document</a>
        </div>
      </div>
    `,
    SHARE: `
      <div class="container">
        <div class="header"><h2>Document Shared With You</h2></div>
        <div class="content">
          <p>${message}</p>
          <p><strong>Role:</strong> ${metadata?.role || 'Viewer'}</p>
          <a href="${metadata?.inviteUrl || '#'}" class="button">Accept Invitation</a>
        </div>
      </div>
    `,
    SYSTEM: `
      <div class="container">
        <div class="header"><h2>System Notification</h2></div>
        <div class="content">
          <p>${message}</p>
        </div>
      </div>
    `
  };

  return baseStyles + (templates[type] || templates.SYSTEM);
};

/**
 * Initialize and start the notification worker
 */
export const initializeNotificationWorker = (): void => {
  // Give Redis a moment to connect before starting worker
  setTimeout(() => {
    if (redisConnection.status !== 'ready') {
      console.warn('⚠️ Redis not ready. Worker will retry in 5 seconds...');
      initializeNotificationWorker();
      return;
    }

    const worker = new Worker(
      'notifications',
      async (job: Job<NotificationData>) => {
        const { userId, email, type, message, metadata } = job.data;

        console.log(
          `🔔 Processing Notification [${type}] for User ${userId}`
        );

        try {
          // Send email if email provided
          if (email && transporter) {
            const mailOptions = {
              from: process.env.SMTP_FROM_NAME 
                ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM || 'noreply@logicveda.com'}>` 
                : 'noreply@logicveda.com',
              to: email,
              subject: `LogicVeda: ${metadata?.title || type}`,
              html: getEmailTemplate(type, message, metadata),
            };

            const info = await transporter.sendMail(mailOptions);

            // Log test email preview URL for development
            if (process.env.NODE_ENV !== 'production') {
              console.log(`📧 Preview: ${nodemailer.getTestMessageUrl(info)}`);
            }
            console.log(`✉️ Email sent to ${email}`);
          }

          // Emit real-time notification via Socket.IO if available
          if (socketIO) {
            socketIO.to(userId).emit('notification:received', {
              type,
              message,
              timestamp: new Date().toISOString(),
              metadata
            });
          }

          return { success: true, jobId: job.id };
        } catch (err: unknown) {
          console.error(
            `❌ Failed to process notification:`,
            err instanceof Error ? err.message : err
          );
          throw err; // Let BullMQ handle retries
        }
      },
      { connection: redisConnection }
    );

    // Event handlers
    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(
        `❌ Job ${job?.id} failed after retries:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
    });

    worker.on('active', (job) => {
      console.log(`⚙️ Processing job ${job.id}`);
    });

    console.log('✅ Notification Worker Initialized and Running');
  }, 2000);
};

/**
 * Get notification queue stats for monitoring
 */
export const getNotificationQueueStats = async () => {
  try {
    const counts = await notificationQueue.getJobCounts();
    return counts;
  } catch (err) {
    console.error('Failed to get queue stats:', err);
    return null;
  }
};

