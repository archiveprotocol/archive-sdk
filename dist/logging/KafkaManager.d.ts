import { ArchiveJsonRpcProvider } from '../web3-wrapper/networkConfigurations';
import { MyRequestConfig } from './config/axios.config';
import { LogQueue, Queues } from './types';
import { Connection } from '@solana/web3.js';
import { Consumer, KafkaConfig, Message, Producer } from 'kafkajs';

export declare class KafkaManager {
  private static instance;
  static producer: Producer;
  private _producer;
  private _isConnected;
  private acks;
  static consumer: Consumer;
  private _consumer;
  private consumerTestGroupID;
  private constructor();
  static getInstance(kafkaConfig?: KafkaConfig): KafkaManager;
  get isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get producer(): Producer;
  get consumer(): Consumer;
  sendResponseTimeToKafka(
    config: MyRequestConfig,
    status: number,
    blueprintId: string,
    requestId?: string,
    responseTimesTopic?: Queues,
    sessionId?: string,
  ): Promise<void>;
  private getHostName;
  sendRpcResponseTimeToKafka(
    rpcUrl: string,
    requestDuration: number,
    requestId?: string,
    responseTimesTopic?: Queues,
    sessionId?: string,
  ): Promise<void>;
  sendRpcFailureToKafka(
    rpcEndpoint: string,
    networkId: string,
    rpcProviderFn: (provider: ArchiveJsonRpcProvider | Connection) => Promise<any>,
    error: any,
    requestId?: string,
    sessionId?: string,
  ): Promise<void>;
  private stringifyQueues;
  sendLogs(msgs: LogQueue[], topic?: Queues): Promise<void>;
  sendMessage(topic: string, messages: Message[]): Promise<void>;
}
