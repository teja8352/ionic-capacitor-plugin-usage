import { Injectable } from '@angular/core';
import {
  MitekSdk,
  SessionResult,
  DocumentType,
  MitekPermissionType,
  PermissionStatus,
} from 'capacitor-mitek-sdk';

export interface MitekLogEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
  data?: unknown;
}

export type SessionType = 'document' | 'face' | 'barcode' | 'voice' | 'nfc';

const LICENSE_STORAGE_KEY = 'mitek_license_key';

@Injectable({ providedIn: 'root' })
export class MitekService {
  private logs: MitekLogEntry[] = [];

  get license(): string {
    return localStorage.getItem(LICENSE_STORAGE_KEY) ?? '';
  }

  set license(value: string) {
    localStorage.setItem(LICENSE_STORAGE_KEY, value);
  }

  getLogs(): MitekLogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  private log(
    level: MitekLogEntry['level'],
    message: string,
    data?: unknown,
  ): void {
    const entry: MitekLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };
    this.logs.unshift(entry);
    const consoleFn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : console.log;
    consoleFn(`[MitekService][${level.toUpperCase()}] ${message}`, data ?? '');
  }

  async checkPermissions(): Promise<PermissionStatus> {
    this.log('info', 'Checking permissions');
    const status = await MitekSdk.checkPermissions();
    this.log('info', 'Permission status', status);
    return status;
  }

  async requestPermissions(
    permissions: MitekPermissionType[],
  ): Promise<PermissionStatus> {
    this.log('info', 'Requesting permissions', permissions);
    const status = await MitekSdk.requestPermissions({ permissions });
    this.log('info', 'Permission result', status);
    return status;
  }

  async ensureCameraPermission(): Promise<boolean> {
    const status = await this.checkPermissions();
    if (status.camera === 'granted') return true;

    if (status.camera === 'denied') {
      this.log(
        'error',
        'Camera permission denied — open device Settings to enable it',
      );
      return false;
    }

    const result = await this.requestPermissions(['camera']);
    const granted = result.camera === 'granted';
    if (!granted) this.log('error', 'Camera permission was not granted');
    return granted;
  }

  async ensureAudioPermission(): Promise<boolean> {
    const status = await this.checkPermissions();
    if (status.audio === 'granted') return true;

    if (status.audio === 'denied') {
      this.log(
        'error',
        'Microphone permission denied — open device Settings to enable it',
      );
      return false;
    }

    const result = await this.requestPermissions(['audio']);
    const granted = result.audio === 'granted';
    if (!granted) this.log('error', 'Microphone permission was not granted');
    return granted;
  }

  async ensureNfcPermission(): Promise<boolean> {
    const status = await this.checkPermissions();
    if (status.nfc === 'granted') return true;

    if (status.nfc === 'denied') {
      this.log(
        'error',
        'NFC permission denied — open device Settings to enable it',
      );
      return false;
    }

    const result = await this.requestPermissions(['nfc']);
    const granted = result.nfc === 'granted';
    if (!granted) this.log('error', 'NFC permission was not granted');
    return granted;
  }

  async startDocumentSession(
    documentType: DocumentType,
  ): Promise<SessionResult> {
    this.log('info', `Starting document session — type: ${documentType}`);
    const hasCamera = await this.ensureCameraPermission();
    if (!hasCamera) {
      return this.buildPermissionDeniedResult('document');
    }

    try {
      const result = await MitekSdk.startDocumentSession({
        license: this.license,
        documentType,
      });
      this.handleResult('document', result);
      return result;
    } catch (err) {
      return this.handleError('document', err);
    }
  }

  async startFaceSession(): Promise<SessionResult> {
    this.log('info', 'Starting face session');
    const hasCamera = await this.ensureCameraPermission();
    if (!hasCamera) {
      return this.buildPermissionDeniedResult('face');
    }

    try {
      const result = await MitekSdk.startFaceSession({ license: this.license });
      this.handleResult('face', result);
      return result;
    } catch (err) {
      return this.handleError('face', err);
    }
  }

  async startBarcodeSession(): Promise<SessionResult> {
    this.log('info', 'Starting barcode session');
    const hasCamera = await this.ensureCameraPermission();
    if (!hasCamera) {
      return this.buildPermissionDeniedResult('barcode');
    }

    try {
      const result = await MitekSdk.startBarcodeSession({ license: this.license });
      this.handleResult('barcode', result);
      return result;
    } catch (err) {
      return this.handleError('barcode', err);
    }
  }

  async startVoiceSession(phrase?: string): Promise<SessionResult> {
    this.log(
      'info',
      `Starting voice session — phrase: ${phrase ?? '(default)'}`,
    );
    const hasAudio = await this.ensureAudioPermission();
    if (!hasAudio) {
      return this.buildPermissionDeniedResult('voice');
    }

    try {
      const result = await MitekSdk.startVoiceSession({
        license: this.license,
        phrase,
      });
      this.handleResult('voice', result);
      return result;
    } catch (err) {
      return this.handleError('voice', err);
    }
  }

  async startNfcSession(options: {
    mrzLine1?: string;
    mrzLine2?: string;
    mrzLine3?: string;
    documentNumber?: string;
    dateOfBirth?: string;
    dateOfExpiry?: string;
    country?: string;
    documentCode?: string;
  }): Promise<SessionResult> {
    this.log('info', 'Starting NFC session', options);
    const hasNfc = await this.ensureNfcPermission();
    if (!hasNfc) {
      return this.buildPermissionDeniedResult('nfc');
    }

    try {
      const result = await MitekSdk.startNfcSession({
        license: this.license,
        ...options,
      });
      this.handleResult('nfc', result);
      return result;
    } catch (err) {
      return this.handleError('nfc', err);
    }
  }

  private handleResult(sessionType: SessionType, result: SessionResult): void {
    if (result.success) {
      this.log('success', `${sessionType} session succeeded`, result);
    } else {
      this.log('warn', `${sessionType} session returned failure`, {
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    }
  }

  private handleError(sessionType: SessionType, err: unknown): SessionResult {
    const message = err instanceof Error ? err.message : String(err);
    this.log('error', `${sessionType} session threw an error: ${message}`, err);
    return {
      success: false,
      sessionType,
      errorCode: 'EXCEPTION',
      errorMessage: message,
    };
  }

  private buildPermissionDeniedResult(sessionType: SessionType): SessionResult {
    return {
      success: false,
      sessionType,
      errorCode: 'PERMISSION_DENIED',
      errorMessage: 'Required permission was not granted.',
    };
  }
}
