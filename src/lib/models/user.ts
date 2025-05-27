export interface User {
  _id?: any; // Changed to any to better support MongoDB ObjectId
  username: string;
  password?: string; // For storing hashed password
  createdAt?: Date;
  email?: string;
  phone?: string;
  wechatOpenId?: string; // For WeChat login
  nickname?: string; // For WeChat login (can be from WeChat or self-set)
  avatarUrl?: string; // For WeChat login (can be from WeChat or self-set)
}
