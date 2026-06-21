export interface CaptureData {
  sourceCanvas: HTMLCanvasElement;
  channelName: string;
  signalStrength: number;
  vhfValue: number;
  uhfValue: number;
  antennaValue: number;
  timestamp: Date;
}

export class ScreenshotPrinter {
  private captureOverlay: HTMLElement;

  constructor() {
    this.captureOverlay = document.getElementById('captureOverlay') as HTMLElement;
  }

  capture(data: CaptureData): void {
    this.triggerFlash();
    setTimeout(() => {
      const imageDataUrl = this.generateScreenshot(data);
      this.showPrintPreview(imageDataUrl);
      this.downloadImage(imageDataUrl, data.timestamp, data.channelName);
    }, 150);
  }

  private triggerFlash(): void {
    this.captureOverlay.classList.add('active');
    setTimeout(() => {
      this.captureOverlay.classList.remove('active');
    }, 400);
  }

  private generateScreenshot(data: CaptureData): string {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d')!;

    const width = 800;
    const height = 600;
    outputCanvas.width = width;
    outputCanvas.height = height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    this.drawCRTScreen(ctx, data.sourceCanvas, width, height);
    this.drawOverlay(ctx, data, width, height);
    this.drawScanlines(ctx, width, height);
    this.drawNoise(ctx, width, height);
    this.drawBorder(ctx, width, height);
    this.drawVignette(ctx, width, height);
    this.drawCRTBurn(ctx, width, height);

    return outputCanvas.toDataURL('image/png');
  }

  private drawCRTScreen(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number
  ): void {
    const screenX = 40;
    const screenY = 40;
    const screenWidth = width - 80;
    const screenHeight = height - 100;

    ctx.save();
    ctx.beginPath();
    ctx.rect(screenX, screenY, screenWidth, screenHeight);
    ctx.clip();

    const sourceAspect = sourceCanvas.width / sourceCanvas.height;
    const targetAspect = screenWidth / screenHeight;

    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (sourceAspect > targetAspect) {
      drawHeight = screenHeight;
      drawWidth = drawHeight * sourceAspect;
      drawX = screenX + (screenWidth - drawWidth) / 2;
      drawY = screenY;
    } else {
      drawWidth = screenWidth;
      drawHeight = drawWidth / sourceAspect;
      drawX = screenX;
      drawY = screenY + (screenHeight - drawHeight) / 2;
    }

    ctx.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);

    ctx.globalCompositeOperation = 'multiply';
    const colorOverlay = ctx.createRadialGradient(
      screenX + screenWidth / 2, screenY + screenHeight / 2, 0,
      screenX + screenWidth / 2, screenY + screenHeight / 2, screenWidth * 0.7
    );
    colorOverlay.addColorStop(0, 'rgba(255, 240, 220, 1)');
    colorOverlay.addColorStop(0.5, 'rgba(255, 220, 180, 1)');
    colorOverlay.addColorStop(1, 'rgba(200, 150, 100, 1)');
    ctx.fillStyle = colorOverlay;
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    ctx.restore();
  }

  private drawOverlay(
    ctx: CanvasRenderingContext2D,
    data: CaptureData,
    width: number,
    height: number
  ): void {
    const fontSize = 14;

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(50, 50, 280, 75);

    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 4;

    ctx.fillText('CH:', 60, 58);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.channelName || 'NO SIGNAL', 100, 58);

    ctx.fillStyle = '#00ff66';
    ctx.fillText('SIGNAL:', 60, 80);
    ctx.fillStyle = '#ffffff';
    const signalPercent = Math.round(data.signalStrength * 100);
    ctx.fillText(`${signalPercent.toString().padStart(3, '0')}%`, 130, 80);

    ctx.fillStyle = signalPercent > 70 ? '#00ff66' : signalPercent > 40 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(180, 82, Math.min(100, signalPercent), 8);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 1;
    ctx.strokeRect(180, 82, 100, 8);

    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(width - 230, 50, 180, 75);

    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = '#44aaff';
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = 4;

    ctx.fillText('VHF:', width - 220, 58);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.round(data.vhfValue).toString().padStart(3, '0'), width - 170, 58);

    ctx.fillStyle = '#ff8844';
    ctx.shadowColor = '#ff8844';
    ctx.fillText('UHF:', width - 220, 80);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.round(data.uhfValue).toString().padStart(3, '0'), width - 170, 80);

    ctx.fillStyle = '#aa44ff';
    ctx.shadowColor = '#aa44ff';
    ctx.fillText('ANT:', width - 110, 58);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.round(data.antennaValue).toString().padStart(3, '0')}°`, width - 60, 58);

    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.fillText('MOD:', width - 110, 80);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AM', width - 60, 80);

    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(50, height - 65, width - 100, 35);

    ctx.font = `bold 12px 'Courier New', monospace`;
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 4;

    const timeStr = this.formatTimestamp(data.timestamp);
    ctx.fillText(`REC ${timeStr}`, 65, height - 56);

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(58, height - 50, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.shadowBlur = 0;
    ctx.font = `10px 'Courier New', monospace`;
    ctx.fillText('FRAME: CRT-001 • TAPE: B-ROLL • DUB: 2ND GEN', 200, height - 50);

    ctx.textAlign = 'right';
    ctx.fillText('TRK: AUTO • HEAD: HI • SP', width - 65, height - 50);

    ctx.restore();

    this.drawBars(ctx, width, height);
  }

  private drawBars(ctx: CanvasRenderingContext2D, _width: number, height: number): void {
    ctx.save();

    const barX = 50;
    const barY = height - 70;
    const barWidth = 6;
    const barHeight = 5;
    const bars = [
      { color: '#ffffff', value: 8 },
      { color: '#ffff00', value: 7 },
      { color: '#00ffff', value: 6 },
      { color: '#00ff00', value: 5 },
      { color: '#ff00ff', value: 4 },
      { color: '#ff0000', value: 3 },
      { color: '#0000ff', value: 2 },
      { color: '#000000', value: 1 }
    ];

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      ctx.fillStyle = bar.color;
      const h = barHeight * bar.value;
      ctx.fillRect(barX + i * (barWidth + 2), barY + (40 - h), barWidth, h);
    }

    ctx.restore();
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.15;

    for (let y = 0; y < height; y += 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, y, width, 1);
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#ffffff';
    for (let y = 1; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }

    ctx.restore();
  }

  private drawNoise(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.08;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 255);
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.02;
    for (let i = 0; i < 5; i++) {
      const y = Math.random() * height;
      const gradient = ctx.createLinearGradient(0, y, width, y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, '#ffffff');
      gradient.addColorStop(0.7, '#ffffff');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, width, 1 + Math.random() * 2);
    }
    ctx.restore();
  }

  private drawBorder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    const cornerSize = 30;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;

    ctx.beginPath();
    ctx.moveTo(25, 25 + cornerSize);
    ctx.lineTo(25, 25);
    ctx.lineTo(25 + cornerSize, 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 25 - cornerSize, 25);
    ctx.lineTo(width - 25, 25);
    ctx.lineTo(width - 25, 25 + cornerSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(25, height - 25 - cornerSize);
    ctx.lineTo(25, height - 25);
    ctx.lineTo(25 + cornerSize, height - 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 25 - cornerSize, height - 25);
    ctx.lineTo(width - 25, height - 25);
    ctx.lineTo(width - 25, height - 25 - cornerSize);
    ctx.stroke();

    ctx.restore();
  }

  private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(200, 200, 200, 1)');
    gradient.addColorStop(1, 'rgba(80, 80, 80, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private drawCRTBurn(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1;

    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 4;
      const offsetY = (Math.random() - 0.5) * 4;

      ctx.fillStyle = i === 0 ? '#ff0000' : i === 1 ? '#00ff00' : '#0000ff';
      ctx.globalAlpha = 0.03;

      const gradient = ctx.createRadialGradient(
        centerX + offsetX, centerY + offsetY, 0,
        centerX + offsetX, centerY + offsetY, width * 0.6
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  private formatTimestamp(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private showPrintPreview(imageDataUrl: string): void {
    const preview = document.createElement('div');
    preview.className = 'capture-print-preview';

    const img = document.createElement('img');
    img.src = imageDataUrl;
    preview.appendChild(img);

    document.body.appendChild(preview);

    setTimeout(() => {
      preview.remove();
    }, 1600);
  }

  private downloadImage(dataUrl: string, timestamp: Date, channelName: string): void {
    const link = document.createElement('a');
    const safeName = (channelName || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    const timeStr = timestamp.toISOString().replace(/[:.]/g, '-');
    link.download = `CRT_CAPTURE_${safeName}_${timeStr}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
