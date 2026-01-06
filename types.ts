
export interface StampRecord {
  id: number;
  timestamp: string;
  name: string;
}

export interface UserProgress {
  stamps: StampRecord[];
  rewardClaimed: boolean;
}

export interface AIResponse {
  message: string;
  encouragement: string;
}
