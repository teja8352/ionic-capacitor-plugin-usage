import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, JsonPipe, NgTemplateOutlet } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonList,
  IonListHeader,
  IonNote,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  idCardOutline,
  personOutline,
  barcodeOutline,
  micOutline,
  wifiOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  informationCircleOutline,
  warningOutline,
  trashOutline,
  keyOutline,
  refreshOutline,
} from 'ionicons/icons';

import { MitekService, MitekLogEntry } from '../services/mitek.service';
import {
  DocumentType,
  SessionResult,
  PermissionStatus,
} from 'capacitor-mitek-sdk';

type TabId =
  | 'document'
  | 'face'
  | 'barcode'
  | 'voice'
  | 'nfc'
  | 'logs'
  | 'permissions';

@Component({
  selector: 'app-mitek',
  templateUrl: './mitek.page.html',
  styleUrls: ['./mitek.page.scss'],
  imports: [
    FormsModule,
    NgTemplateOutlet,
    DatePipe,
    JsonPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonList,
    IonListHeader,
    IonNote,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
  ],
})
export class MitekPage {
  activeTab: TabId = 'document';

  // Document session
  documentType: DocumentType = 'PASSPORT';
  readonly documentTypes: DocumentType[] = [
    'PASSPORT',
    'ID_FRONT',
    'ID_BACK',
    'CHECK_FRONT',
    'CHECK_BACK',
    'GENERIC_DOCUMENT',
  ];

  // Voice session
  voicePhrase = '';

  // NFC session
  nfcMrzLine1 = '';
  nfcMrzLine2 = '';
  nfcMrzLine3 = '';
  nfcDocumentNumber = '';
  nfcDateOfBirth = '';
  nfcDateOfExpiry = '';
  nfcCountry = '';
  nfcDocumentCode = '';

  // State
  loading = false;
  result: SessionResult | null = null;
  permissions: PermissionStatus | null = null;

  constructor(private mitek: MitekService) {
    addIcons({
      idCardOutline,
      personOutline,
      barcodeOutline,
      micOutline,
      wifiOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      informationCircleOutline,
      warningOutline,
      trashOutline,
      keyOutline,
      refreshOutline,
    });
  }

  get license(): string { return this.mitek.license; }
  set license(v: string) { this.mitek.license = v; }

  get logs(): MitekLogEntry[] {
    return this.mitek.getLogs();
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.result = null;
  }

  async checkPermissions(): Promise<void> {
    this.loading = true;
    try {
      this.permissions = await this.mitek.checkPermissions();
    } finally {
      this.loading = false;
    }
  }

  async requestAllPermissions(): Promise<void> {
    this.loading = true;
    try {
      this.permissions = await this.mitek.requestPermissions([
        'camera',
        'audio',
        'nfc',
      ]);
    } finally {
      this.loading = false;
    }
  }

  async runDocumentSession(): Promise<void> {
    this.loading = true;
    this.result = null;
    try {
      this.result = await this.mitek.startDocumentSession(this.documentType);
    } finally {
      this.loading = false;
    }
  }

  async runFaceSession(): Promise<void> {
    this.loading = true;
    this.result = null;
    try {
      this.result = await this.mitek.startFaceSession();
    } finally {
      this.loading = false;
    }
  }

  async runBarcodeSession(): Promise<void> {
    this.loading = true;
    this.result = null;
    try {
      this.result = await this.mitek.startBarcodeSession();
    } finally {
      this.loading = false;
    }
  }

  async runVoiceSession(): Promise<void> {
    this.loading = true;
    this.result = null;
    try {
      this.result = await this.mitek.startVoiceSession(
        this.voicePhrase || undefined,
      );
    } finally {
      this.loading = false;
    }
  }

  async runNfcSession(): Promise<void> {
    this.loading = true;
    this.result = null;
    try {
      this.result = await this.mitek.startNfcSession({
        mrzLine1: this.nfcMrzLine1 || undefined,
        mrzLine2: this.nfcMrzLine2 || undefined,
        mrzLine3: this.nfcMrzLine3 || undefined,
        documentNumber: this.nfcDocumentNumber || undefined,
        dateOfBirth: this.nfcDateOfBirth || undefined,
        dateOfExpiry: this.nfcDateOfExpiry || undefined,
        country: this.nfcCountry || undefined,
        documentCode: this.nfcDocumentCode || undefined,
      });
    } finally {
      this.loading = false;
    }
  }

  clearLogs(): void {
    this.mitek.clearLogs();
  }

  logLevelColor(level: MitekLogEntry['level']): string {
    const map: Record<MitekLogEntry['level'], string> = {
      success: 'success',
      error: 'danger',
      warn: 'warning',
      info: 'primary',
    };
    return map[level];
  }

  permissionColor(state: string | undefined): string {
    if (state === 'granted') return 'success';
    if (state === 'denied') return 'danger';
    return 'warning';
  }

  resultJson(): string {
    if (!this.result) return '';
    const r = { ...this.result };
    if (r.imageBase64 && r.imageBase64.length > 80) {
      r.imageBase64 = r.imageBase64.substring(0, 80) + '...[truncated]';
    }
    if (r.aiBasedRtsBase64 && r.aiBasedRtsBase64.length > 80) {
      r.aiBasedRtsBase64 =
        r.aiBasedRtsBase64.substring(0, 80) + '...[truncated]';
    }
    if (r.nfcData?.faceImageBase64 && r.nfcData.faceImageBase64.length > 80) {
      r.nfcData = {
        ...r.nfcData,
        faceImageBase64:
          r.nfcData.faceImageBase64.substring(0, 80) + '...[truncated]',
      };
    }
    return JSON.stringify(r, null, 2);
  }
}
