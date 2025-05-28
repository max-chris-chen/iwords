export enum CourseStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

export interface LessonSentence {
  text: string; // 英文句子
  audioUrl: string; // 句子音频
  caption: string; // 字幕信息
}

export interface Lesson {
  _id?: string;
  title: string;
  content: string; // 课时内容
  text: string; // 课时英文原文
  sentences: LessonSentence[]; // 分句及音频/字幕
  // 可根据需要添加更多字段
}

export interface Section {
  _id?: string;
  title: string;
  lessons: Lesson[];
  // 可根据需要添加更多字段
}

export interface Course {
  _id?: string;
  title: string;
  coverImage: string; // 封面图片URL
  description: string; // 课程简介
  user: string; // 创建课程的用户ID
  status: CourseStatus; // 课程状态
  isPublic: boolean; // 是否公开
  publishAt?: Date; // 发布时间
  createdAt: Date;
  updatedAt: Date;
  sections: Section[]; // 课程章节
}
