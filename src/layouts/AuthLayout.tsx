import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BadgeCheck, BookOpen, AlertTriangle, LiveTv, TrendingUp } from '@/icons';
import { BrandMark } from '../components/ui/BrandMark';
import { useSiteSettings } from '../store/SiteSettingsContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AuthLayout() {
  const { t } = useTranslation('auth');
  const { settings, platform, loaded } = useSiteSettings();

  const features = useMemo(() => [
    { icon: LiveTv, title: t('layout.feature1Title'), desc: t('layout.feature1Desc') },
    { icon: Award, title: t('layout.feature2Title'), desc: t('layout.feature2Desc') },
    { icon: BookOpen, title: t('layout.feature3Title'), desc: t('layout.feature3Desc') },
  ], [t]);

  const stats = useMemo(() => [
    { value: '+12K', label: t('layout.statLearners') },
    { value: '+450', label: t('layout.statCourses') },
    { value: '98%', label: t('layout.statSatisfaction') },
  ], [t]);

  return (
    <div className="grid min-h-dvh w-full grid-cols-1 bg-surface lg:grid-cols-[52%_48%]">
      <aside className="relative hidden overflow-hidden p-8 text-on-primary lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:gap-8 lg:self-start xl:p-10">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(150deg, #1799a7 0%, #0a8392 45%, #006874 100%)' }}
        />
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-16 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'rgba(255,255,255,0.16)' }}
          animate={{ y: [0, 24, 0], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'rgba(23,153,167,0.40)' }}
          animate={{ y: [0, -28, 0], opacity: [0.45, 0.65, 0.45] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />

        <motion.div className="relative z-10" initial="hidden" animate="show" custom={0} variants={fadeUp}>
          <BrandMark variant="auth" />
        </motion.div>

        <div className="relative z-10 max-w-md">
          <motion.h1
            className="mb-4 text-3xl font-extrabold leading-[1.2] xl:text-4xl"
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
          >
            {settings.platformTagline || t('layout.taglineFallback')}
          </motion.h1>
          <motion.p
            className="mb-7 max-w-sm text-base leading-relaxed text-white/80"
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
          >
            {t('layout.heroDesc')}
          </motion.p>

          <div className="grid gap-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                animate="show"
                custom={3 + i}
                variants={fadeUp}
                whileHover={{ scale: 1.02, x: -4 }}
                className="flex items-start gap-3.5 rounded-2xl border border-white/15 p-3.5 backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
                  <feature.icon size={24} />
                </span>
                <div>
                  <h3 className="mb-0.5 text-[0.98rem] font-bold">{feature.title}</h3>
                  <p className="text-[0.82rem] leading-relaxed text-white/75">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div className="relative z-10 flex items-center gap-7" initial="hidden" animate="show" custom={6} variants={fadeUp}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-extrabold">{stat.value}</div>
              <div className="text-[0.82rem] text-white/70">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute top-28 left-10 z-10 hidden items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-primary shadow-xl xl:flex"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BadgeCheck size={20} />
          <span className="text-sm font-bold">{t('layout.badgeTrusted')}</span>
        </motion.div>
        <motion.div
          aria-hidden
          className="absolute bottom-36 left-16 z-10 hidden items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-primary shadow-xl xl:flex"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <TrendingUp size={20} />
          <span className="text-sm font-bold">{t('layout.badgeProgress')}</span>
        </motion.div>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:min-h-dvh lg:px-10">
        {loaded && platform.maintenanceMode ? (
          <div className="mb-5 w-full max-w-[500px] flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning-container/35 p-4">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <p className="font-bold text-on-surface">{t('layout.maintenanceTitle')}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t('layout.maintenanceDesc')}</p>
            </div>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
