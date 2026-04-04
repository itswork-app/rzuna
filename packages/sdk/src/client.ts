import axios, { AxiosInstance } from 'axios';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { AivoConfig, SignalEvent, SwapParams } from './types/index.js';

/**
 * 🏛️ AivoClient: The Nerve of RZUNA B2B
 * Standar: Canonical Master Blueprint v22.1 (The Nerve)
 */
export class AivoClient extends EventEmitter {
  private api: AxiosInstance;
  private ws: WebSocket | null = null;
  private config: AivoConfig;

  constructor(config: AivoConfig) {
    super();
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': '@rzuna/sdk-v22.1',
      },
    });
  }

  /**
   * 📡 Listen to real-time alpha signals
   */
  getSignalStream() {
    if (this.ws) return this.ws;

    this.ws = new WebSocket(`${this.config.wssUrl}?apiKey=${this.config.apiKey}`);

    this.ws.on('open', () => {
      this.emit('connected');
    });

    this.ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        this.emit('signal', payload as SignalEvent);
      } catch (err) {
        this.emit('error', err);
      }
    });

    this.ws.on('close', () => {
      this.emit('disconnected');
      this.ws = null;
    });

    this.ws.on('error', (err) => {
      this.emit('error', err);
    });

    return this.ws;
  }

  /**
   * 🧠 Get detailed AI intelligence for a token
   * Fetches scores, social metadata, and deep-reasoning logs.
   */
  async getTokenIntelligence(mint: string) {
    const { data } = await this.api.get(`/sdk/intelligence/${mint}`);
    return data as SignalEvent;
  }

  /**
   * 💹 Execute a high-speed swap via AIVO Engine
   * Note: B2B Fees (0.5% - 1.5%) are applied by the Engine based on Tier.
   */
  async executeSwap(params: SwapParams) {
    const { data } = await this.api.post('/sdk/trade/swap', params);
    return data;
  }

  /**
   * 📊 Get current usage and quota status
   */
  async getUsageStatus() {
    const { data } = await this.api.get('/sdk/usage');
    return data;
  }
}
