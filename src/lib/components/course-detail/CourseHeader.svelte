<script lang="ts">
  import type { Course, Section, Lesson } from "$lib/models/course";

  // Extended Course type that includes sections with lessons
  interface CourseWithSections extends Course {
    sections: Array<
      Section & {
        description?: string;
        lessons: Array<Lesson & { duration?: string }>;
      }
    >;
    totalLessons?: number;
  }

  let { course }: { course: CourseWithSections } = $props();
</script>

<div class="course-hero-card">
  <div class="course-image-placeholder">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#818CF8;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#3730A3;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366F1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="url(#grad1)"/>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v1H6.5A2.5 2.5 0 0 0 4 19.5z" fill="url(#grad2)"/>
      <path d="M7 6h10v1H7V6zm0 4h10v1H7v-1zm0 4h5v1H7v-1z" fill="white"/>
    </svg>
  </div>
  <div class="course-info">
    <h1>{course.title}</h1>
    <p class="course-description">
      {course.description || ""}
    </p>
    <div class="course-stats">
      <!-- <span class="stat">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
            cx="9"
            cy="7"
            r="4"
          /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
            d="M16 3.13a4 4 0 0 1 0 7.75"
          /></svg
        >
        <span>{course.studentCount || 0} 学员</span>
      </span> -->
      <span class="stat">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10" /><polyline
            points="12 6 12 12 16 14"
          /></svg
        >
        <span>{course.totalLessons || 0} 课时</span>
      </span>
      <span class="stat">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path
            d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
          /></svg
        >
        <span>{course.sections?.length || 0} 章节</span>
      </span>
    </div>
  </div>
</div>

<style>
  .course-hero-card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 2rem;
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
  }
  .course-image-placeholder {
    width: 12rem;
    height: 9rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    flex-shrink: 0;
  }
  .course-info {
    flex-grow: 1;
  }
  .course-info h1 {
    font-size: 1.875rem;
    font-weight: bold;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }
  .course-description {
    font-size: 1rem;
    color: var(--text-light);
    margin-bottom: 1.5rem;
  }
  .course-stats {
    display: flex;
    gap: 1.5rem;
    color: var(--text-secondary);
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .stat svg {
    color: var(--text-light);
  }
</style>
