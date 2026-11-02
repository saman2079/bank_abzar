export type ChatMessageDto = {
  seq: number;
  sender: "VISITOR" | "STAFF";
  body: string;
  /** ISO */
  createdAt: string;
};
