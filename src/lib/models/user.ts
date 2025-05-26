export interface User {
  _id?: string; // Optional: MongoDB will generate it
  username: string;
  email: string;
  phone: string;
  createdAt?: Date;
}
