import { ArchiveJsonRpcProvider } from '../web3-wrapper/networkConfigurations';
import { MyRequestConfig } from './config/axios.config';
import { defaultKafkaConfig } from './kafkaConfig';
import { BaseQueue, LogQueue, Queues, ResponseTimeQueue, RpcFailureQueue } from './types';
import { Connection } from '@solana/web3.js';
import { Consumer, Kafka, KafkaConfig, Message, Producer } from 'kafkajs';

export class KafkaManager {
  private static instance: KafkaManager;
  static producer: Producer;
  private _producer: Producer;
  private _isConnected = false;
  private acks = 0;
  // need a consumer for the e2e tests
  static consumer: Consumer;
  private _consumer: Consumer;
  private consumerTestGroupID = 'test-kafka-manager';

  private constructor(kafkaConfig?: KafkaConfig) {
    if (
      !kafkaConfig &&
      (!process.env.KAFKA_BROKER_URL || !process.env.KAFKA_PRODUCER_USERNAME || !process.env.KAFKA_PRODUCER_PASSWORD)
    ) {
      console.error('Kafka environment variable is not set');
      return;
    }

    const kafkaClient = new Kafka(kafkaConfig ?? defaultKafkaConfig);

    this._producer = kafkaClient.producer();
    this._consumer = kafkaClient.consumer({ groupId: this.consumerTestGroupID });
  }

  public static getInstance(kafkaConfig?: KafkaConfig): KafkaManager {
    if (!KafkaManager.instance) {
      KafkaManager.instance = new KafkaManager(kafkaConfig);
    }
    return KafkaManager.instance;
  }

  public get isConnected() {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    try {
      await this._producer.connect();
      this._isConnected = true;
    } catch (err) {
      console.error('KafkaManager Error: producer failed to connect to broker', err, err.trace);
    }
  }

  async disconnect() {
    try {
      const kafkaManager = KafkaManager.getInstance();
      if (kafkaManager.isConnected) {
        const producer = kafkaManager.producer;
        await producer.disconnect();
        const consumer = kafkaManager.producer;
        await consumer.disconnect();
      }
    } catch (err) {
      console.error('Failed to disconnect kafka client', err);
    }
  }

  get producer() {
    return this._producer;
  }

  get consumer() {
    return this._consumer;
  }

  async sendResponseTimeToKafka(
    config: MyRequestConfig,
    status: number,
    blueprintId: string,
    requestId?: string,
    responseTimesTopic = Queues.RESPONSE_TIMES,
    sessionId?: string,
  ): Promise<void> {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;

    const timestamp = Math.floor(new Date().getTime());
    const requestDuration = config.metadata.duration;
    const hostName = this.getHostName(config.url);

    const responseTime = {
      url: config.url,
      hostName: hostName,
      blueprintId: blueprintId,
      // TODO  i can only presume indexerId was supposed to be a unique identifier for each AP producer instance
      indexerId: 'INDEXER-ID',
      responseStatusCode: status,
      responseTimeMs: requestDuration,
      timestamp: timestamp,
      requestId: requestId,
      extras: {
        requestId: requestId,
        nodeEnv: process.env.NODE_ENV,
        sessionId,
      },
    } as ResponseTimeQueue;

    const responseTimeQueuesAsJson = this.stringifyQueues([responseTime]);
    this.sendMessage(responseTimesTopic, responseTimeQueuesAsJson);
  }

  private getHostName(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch (error) {
      console.error('Invalid URL:', error);
      return '';
    }
  }

  async sendRpcResponseTimeToKafka(
    rpcUrl: string,
    requestDuration: number,
    requestId?: string,
    responseTimesTopic = Queues.RESPONSE_TIMES,
    sessionId?: string,
  ): Promise<void> {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;
    const timestamp = Math.floor(new Date().getTime());
    const hostName = this.getHostName(rpcUrl);

    const responseTime = {
      url: rpcUrl,
      hostName: hostName,
      blueprintId: 'defaultBlueprintId',
      // TODO  i can only presume indexerId was supposed to be a unique identifier for each AP producer instance
      indexerId: 'INDEXER-ID',
      responseStatusCode: -1,
      responseTimeMs: Math.trunc(requestDuration),
      timestamp: timestamp,
      requestId: requestId,
      extras: {
        requestId: requestId,
        nodeEnv: process.env.NODE_ENV,
        sessionId,
      },
    } as ResponseTimeQueue;

    const responseTimeQueuesAsJson = this.stringifyQueues([responseTime]);

    this.sendMessage(responseTimesTopic, responseTimeQueuesAsJson);
  }

  async sendRpcFailureToKafka(
    rpcEndpoint: string,
    networkId: string,
    rpcProviderFn: (provider: ArchiveJsonRpcProvider | Connection) => Promise<any>,
    error: any,
    requestId?: string,
    sessionId?: string,
  ): Promise<void> {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;
    const timestamp = Math.floor(new Date().getTime());
    const errorCode = error.code || error.error?.code || 0;

    const rpcFailure = {
      rpcEndpoint,
      networkId,
      calledFunction: rpcProviderFn.toString(),
      errorMessage: error.message,
      errorCode,
      timestamp,
      extras: {
        requestId: requestId,
        nodeEnv: process.env.NODE_ENV,
        sessionId,
      },
    } as RpcFailureQueue;

    const rpcCallAsJson = this.stringifyQueues([rpcFailure]);

    this.sendMessage(Queues.RPC_FAILURE, rpcCallAsJson);
  }

  private stringifyQueues = (array: BaseQueue[]) =>
    array.map((r) => {
      return { value: JSON.stringify(r) };
    });

  public async sendLogs(msgs: LogQueue[], topic: Queues = Queues.LOGS) {
    await this.sendMessage(
      topic,
      msgs.map((msg) => {
        return {
          key: msg.blueprintId,
          value: JSON.stringify(msg),
        } as Message;
      }),
    );
  }

  // TODO disconnecting before app shuts down https://stackoverflow.com/questions/67243831/do-we-need-to-connect-everytime-we-producer-kafka-message
  async sendMessage(topic: string, messages: Message[]) {
    if (!this.isConnected) {
      await this.connect();
    }
    if (!this.isConnected) return;
    await this.producer.send({
      topic,
      messages,
      acks: this.acks,
    });
  }
}
