import crypto from 'crypto';
import { prisma } from '../database/client.js';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here-change-this';
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export class CredentialService {
  async saveCredential(name: string, type: string, data: Record<string, any>): Promise<string> {
    const encryptedData = this.encrypt(JSON.stringify(data));
    
    const credential = await prisma.credential.create({
      data: {
        name,
        type,
        encryptedData
      }
    });

    return credential.id;
  }

  async getCredential(id: string): Promise<{ name: string; type: string; data: Record<string, any> } | null> {
    const credential = await prisma.credential.findUnique({
      where: { id }
    });

    if (!credential) return null;

    const decryptedData = this.decrypt(credential.encryptedData);
    
    return {
      name: credential.name,
      type: credential.type,
      data: JSON.parse(decryptedData)
    };
  }

  async getAllCredentials(): Promise<Array<{ id: string; name: string; type: string; createdAt: string }>> {
    const credentials = await prisma.credential.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return credentials.map(cred => ({
      ...cred,
      createdAt: cred.createdAt.toISOString()
    }));
  }

  async updateCredential(id: string, data: Record<string, any>): Promise<void> {
    const encryptedData = this.encrypt(JSON.stringify(data));
    
    await prisma.credential.update({
      where: { id },
      data: { encryptedData }
    });
  }

  async deleteCredential(id: string): Promise<void> {
    await prisma.credential.delete({
      where: { id }
    });
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, KEY);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export const credentialService = new CredentialService();
