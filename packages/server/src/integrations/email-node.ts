import nodemailer from 'nodemailer';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { getNestedValue, replaceVariables } from '../utils/variable-utils.js';

export class EmailNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    
    // SMTP Configuration
    const smtpHost = config.smtpHost || process.env.SMTP_HOST || '';
    const smtpPort = config.smtpPort || process.env.SMTP_PORT || 587;
    const smtpUser = config.smtpUser || process.env.SMTP_USER || '';
    const smtpPass = config.smtpPass || process.env.SMTP_PASS || '';
    const smtpSecure = config.smtpSecure || false;

    // Email Configuration
    const from = config.from || smtpUser;
    const to = config.to || '';
    const cc = config.cc || '';
    const bcc = config.bcc || '';
    const subject = config.subject || 'FlowForge Notification';
    const text = config.text || '';
    const html = config.html || '';

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('Email node requires SMTP configuration (host, user, password)');
    }

    if (!to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!text && !html) {
      throw new Error('Email content (text or html) is required');
    }

    // Replace variables in email content
    const processedSubject = replaceVariables(subject, context.data);
    const processedText = replaceVariables(text, context.data);
    const processedHtml = replaceVariables(html, context.data);

    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Boolean(smtpSecure),
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Verify connection
      await transporter.verify();

      // Send email
      const mailOptions: any = {
        from,
        to,
        subject: processedSubject
      };

      if (cc) mailOptions.cc = cc;
      if (bcc) mailOptions.bcc = bcc;
      if (processedText) mailOptions.text = processedText;
      if (processedHtml) mailOptions.html = processedHtml;

      const result = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        from,
        to,
        subject: processedSubject,
        accepted: result.accepted,
        rejected: result.rejected
      };

    } catch (error: any) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

export const emailNodeExecutor = new EmailNodeExecutor();
