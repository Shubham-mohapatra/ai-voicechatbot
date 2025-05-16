export type Message = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  emotion?: 'happy' | 'neutral' | 'thinking' | 'confused';
  context?: string;
  animated?: boolean;
};