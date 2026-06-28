import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@/icons';
import { StudentCourseCard } from './StudentCourseCard';

const ROTATE_MS = 5500;

function useSlideSize() {
  const [size, setSize] = useState(5);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width <= 640) setSize(2);
      else if (width <= 900) setSize(3);
      else if (width <= 1200) setSize(4);
      else if (width <= 1440) setSize(5);
      else setSize(6);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

interface DashboardBrowseCarouselProps {
  courses: any[];
  enrolledIds: Set<number>;
  viewAllHref: string;
  viewAllLabel: string;
  onCourseAction: (courseId: number, isEnrolled: boolean) => void;
}

export function DashboardBrowseCarousel({
  courses,
  enrolledIds,
  viewAllHref,
  viewAllLabel,
  onCourseAction,
}: DashboardBrowseCarouselProps) {
  const slideSize = useSlideSize();

  const slides = useMemo(() => {
    const chunks: any[][] = [];
    for (let i = 0; i < courses.length; i += slideSize) {
      chunks.push(courses.slice(i, i + slideSize));
    }
    return chunks.length ? chunks : [[]];
  }, [courses, slideSize]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide(0);
  }, [courses]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="student-dashboard-browse-row">
      <div
        className="student-dashboard-browse-carousel"
        aria-live="polite"
        aria-label={viewAllLabel}
      >
        <div
          className="student-dashboard-browse-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((group, slideIndex) => (
            <div
              key={`slide-${slideIndex}`}
              className="student-dashboard-browse-slide"
              aria-hidden={slideIndex !== activeSlide}
            >
              {group.map((course) => (
                <StudentCourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledIds.has(course.id)}
                  compact
                  onPrimaryAction={() => onCourseAction(course.id, enrolledIds.has(course.id))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Link
        to={viewAllHref}
        className="student-dashboard-browse-more"
        aria-label={viewAllLabel}
        title={viewAllLabel}
      >
        <ChevronRight size={20} aria-hidden />
      </Link>
    </div>
  );
}
