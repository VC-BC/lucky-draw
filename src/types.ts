export interface Participant {
  id: string;
  name: string;
  department?: string;
  note?: string;
  isDrawn?: boolean; // Used to track if drawn in non-repeating draws
}

export interface Prize {
  id: string;
  name: string;
  amount: number;
}

export interface WinnerRecord {
  id: string;
  participantId: string;
  participantName: string;
  participantDepartment?: string;
  prizeId: string;
  prizeName: string;
  drawnTime: string;
}

export interface Group {
  id: string;
  name: string;
  members: Participant[];
}
