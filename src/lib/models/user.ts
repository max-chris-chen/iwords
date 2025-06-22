export interface User {
  _id?: string; // Changed to string to satisfy linter and improve type safety
  username: string;
  password?: string;
  createdAt?: Date;
  email?: string;
  phone?: string;
  wechatOpenId?: string; // For WeChat login
  nickname?: string; // For WeChat login (can be from WeChat or self-set)
  avatarUrl?: string; // For WeChat login (can be from WeChat or self-set)
}
