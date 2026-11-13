import React, { useState } from 'react';
import { Grid, Orbit, MapPin, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Category, LanguageCode, Universe } from '../types/hub';
import { ResilientImage, VedashilaCompactMark } from './BrandMark';
import { t } from '../lib/i18n';

interface ConstellationNavProps {
  universes: Universe[];
  categories: Category[];
  language: LanguageCode;
  isIndore: boolean;
  reducedMotion: boolean;
  selectedUniverseId: string | null;
  onSelectUniverse: (universeId: string) => void;
  onSelectCategory?: (universeId: string, categoryId: string) => void;
}

export const ConstellationNav: React.FC<ConstellationNavProps> = ({
  universes,
  categories,
  language,
  isIndore,
  reducedMotion,
  selectedUniverseId,
  onSelectUniverse,
  onSelectCategory,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'constellation'>('grid');
  const activeUniverses = universes.filter((u) => u.active).sort((a, b) => a.sortOrder - b.sortOrder);

  const getUniverseCategories = (universeId: string) => {
    const activeCats = categories.filter((c) => c.active && c.universeId === universeId);
    const parents = activeCats
      .filter((c) => !c.parentCategoryId || !activeCats.some((p) => p.id === c.parentCategoryId))
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    const getChildren = (parentId: string) =>
      activeCats
        .filter((c) => c.parentCategoryId === parentId)
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    return { parents, getChildren };
  };

  return (
    <section aria-labelledby="universes-heading" className="py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#073D35] dark:text-[#C89A45] mb-1">
            {language === 'hi' ? 'श्रेणी और ब्रह्मांड निर्देशिका' : 'Configurable Shopping Universes & Categories'}
          </p>
          <h1 id="universes-heading" className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-[#FFFFFF]">
            {language === 'hi' ? 'वेदशिला मार्केटप्लेस श्रेणियाँ' : 'Explore Marketplace Categories'}
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#FFFFFF] dark:bg-[#0E2924] border border-[#073D35]/15 dark:border-[#C89A45]/25 self-start">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'grid'
                ? 'bg-[#073D35] text-[#FFFFFF] dark:bg-[#C89A45] dark:text-[#073D35]'
                : 'text-[#252525]/75 dark:text-[#F8F2E8]/80 hover:text-[#C89A45]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            {t(language, 'gridMode')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('constellation')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'constellation'
                ? 'bg-[#073D35] text-[#FFFFFF] dark:bg-[#C89A45] dark:text-[#073D35]'
                : 'text-[#252525]/75 dark:text-[#F8F2E8]/80 hover:text-[#C89A45]'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            {t(language, 'constellationMode')}
          </button>
        </div>
      </div>

      {viewMode === 'constellation' ? (
        <div className="relative rounded-2xl border border-[#C89A45]/30 bg-[#073D35] text-[#F8F2E8] p-6 md:p-10 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex items-center justify-center py-4">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                <svg
                  viewBox="0 0 320 320"
                  className={`w-full h-full ${reducedMotion ? '' : 'animate-orbit-slow'}`}
                  aria-hidden="true"
                >
                  <circle cx="160" cy="160" r="142" stroke="#C89A45" strokeOpacity="0.38" strokeDasharray="4 6" fill="none" />
                  <circle cx="160" cy="160" r="102" stroke="#F8F2E8" strokeOpacity="0.32" fill="none" />
                  <circle cx="160" cy="160" r="56" stroke="#F47D79" strokeOpacity="0.55" fill="none" />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-[#F6EDE2] border-2 border-[#C89A45] flex flex-col items-center justify-center text-center p-2 shadow-lg">
                    <VedashilaCompactMark className="w-12 h-12" />
                    <span className="text-[10px] font-bold text-[#073D35] mt-0.5">{activeUniverses.length} Worlds</span>
                  </div>
                </div>

                {activeUniverses.slice(0, 8).map((u, idx) => {
                  const total = Math.min(activeUniverses.length, 8);
                  const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
                  const radius = 118;
                  const x = 160 + Math.cos(angle) * radius;
                  const y = 160 + Math.sin(angle) * radius;
                  const isSelected = selectedUniverseId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onSelectUniverse(u.id)}
                      style={{
                        left: `${(x / 320) * 100}%`,
                        top: `${(y / 320) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-transform whitespace-nowrap max-w-[110px] truncate ${
                        isSelected
                          ? 'bg-[#C89A45] text-[#073D35] scale-105 shadow-md'
                          : 'bg-[#042621]/95 text-[#F8F2E8] border border-[#C89A45]/40 hover:border-[#C89A45]'
                      }`}
                    >
                      {language === 'hi' ? u.nameHi : u.nameEn.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeUniverses.map((u) => {
                const locked = u.indoreOnly && !isIndore;
                const isSelected = selectedUniverseId === u.id;
                const { parents, getChildren } = getUniverseCategories(u.id);
                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0B4F45] border-[#C89A45]'
                        : 'bg-[#042621]/85 border-white/15 hover:border-[#C89A45]/70'
                    }`}
                  >
                    <button type="button" onClick={() => onSelectUniverse(u.id)} className="text-left w-full">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-[#FFFFFF] truncate">
                          {language === 'hi' ? u.nameHi : u.nameEn}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-[#C89A45] shrink-0 mt-1" />
                      </div>
                      <p className="text-xs text-[#F8F2E8]/75 mt-1 line-clamp-2">
                        {language === 'hi' ? u.subtitleHi : u.subtitleEn}
                      </p>
                    </button>

                    {parents.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        {parents.map((cat) => {
                          const subs = getChildren(cat.id);
                          return (
                            <div key={cat.id} className="text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectCategory ? onSelectCategory(u.id, cat.id) : onSelectUniverse(u.id)
                                }
                                className="inline-flex items-center gap-1 text-[#F8F2E8]/90 hover:text-[#C89A45] font-medium"
                              >
                                <ChevronRight className="w-3 h-3 text-[#C89A45]" />
                                <span>{language === 'hi' ? cat.nameHi : cat.nameEn}</span>
                              </button>
                              {subs.length > 0 && (
                                <div className="pl-4 flex flex-wrap gap-x-2 text-[10px] text-[#F8F2E8]/70">
                                  {subs.map((sub) => (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() =>
                                        onSelectCategory ? onSelectCategory(u.id, sub.id) : onSelectUniverse(u.id)
                                      }
                                      className="hover:text-[#C89A45]"
                                    >
                                      · {language === 'hi' ? sub.nameHi : sub.nameEn}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {u.indoreOnly && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#C89A45]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{locked ? 'Indore Only · Restricted in current city' : 'Indore Serviceable Zone'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeUniverses.map((u) => {
            const { parents, getChildren } = getUniverseCategories(u.id);
            return (
              <div
                key={u.id}
                className="rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] overflow-hidden flex flex-col"
              >
                {u.imageUrl && (
                  <button
                    type="button"
                    onClick={() => onSelectUniverse(u.id)}
                    className="aspect-[16/9] w-full overflow-hidden block"
                  >
                    <ResilientImage src={u.imageUrl} alt={u.nameEn} />
                  </button>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <button type="button" onClick={() => onSelectUniverse(u.id)} className="text-left w-full">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-1">
                      <span className={u.indoreOnly ? 'text-[#073D35] dark:text-[#5FD1B8]' : 'text-[#9F7323] dark:text-[#C89A45]'}>
                        {u.indoreOnly ? 'Indore Exclusive' : 'Pan-India'}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[#C89A45]" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#073D35] dark:text-[#FFFFFF]">
                      {language === 'hi' ? u.nameHi : u.nameEn}
                    </h3>
                    <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75 mt-1">
                      {language === 'hi' ? u.subtitleHi : u.subtitleEn}
                    </p>
                  </button>

                  {parents.length > 0 && (
                    <div className="pt-3 border-t border-[#073D35]/10 dark:border-white/10 space-y-1.5">
                      {parents.map((cat) => {
                        const subs = getChildren(cat.id);
                        return (
                          <div key={cat.id} className="text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectCategory ? onSelectCategory(u.id, cat.id) : onSelectUniverse(u.id)
                              }
                              className="font-medium hover:text-[#C89A45] inline-flex items-center gap-1"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-[#C89A45]" />
                              {language === 'hi' ? cat.nameHi : cat.nameEn}
                            </button>
                            {subs.length > 0 && (
                              <div className="pl-5 flex flex-wrap gap-x-2 text-[11px] text-[#252525]/65 dark:text-[#F8F2E8]/65">
                                {subs.map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() =>
                                      onSelectCategory ? onSelectCategory(u.id, sub.id) : onSelectUniverse(u.id)
                                    }
                                    className="hover:text-[#073D35] dark:hover:text-[#C89A45]"
                                  >
                                    · {language === 'hi' ? sub.nameHi : sub.nameEn}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
