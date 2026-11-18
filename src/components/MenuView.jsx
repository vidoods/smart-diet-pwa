import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Flame, Sparkles, ChevronDown, Info, Users } from 'lucide-react';
import { calculateProfileMetrics, scaleTextWeights, scaleMacros } from '../utils/dietEngine';

const MEAL_SECTIONS = [
  { key: 'breakfast', label: 'Завтрак', time: '06:00 – 09:00', accent: 'from-amber-500 to-orange-500' },
  { key: 'secondBreakfast', label: 'Второй завтрак', time: '09:00 – 11:00', accent: 'from-emerald-500 to-teal-500' },
  { key: 'lunch', label: 'Обед', time: '12:00 – 14:00', accent: 'from-sky-500 to-indigo-500' },
  { key: 'dinner', label: 'Ужин', time: '17:00 – 20:00', accent: 'from-violet-500 to-purple-600' }
];

export default function MenuView({
  profile,
  menuData,
  selected,
  linkedMembers = [],
  onSelectMeal,
  onSyncMenu,
  isSyncing,
  isOffline
}) {
  const [mode, setMode] = useState('regular'); // 'regular' | 'fasting'
  // Все блоки приёмов пищи (включая Завтрак) закрыты по умолчанию при открытии страницы
  const [openSection, setOpenSection] = useState(null);

  const metrics = calculateProfileMetrics(profile);
  if (!metrics) return null;

  const { targetKcal, scale } = metrics;

  // Суммируем КБЖУ вашего выбранного рациона на день
  const totals = MEAL_SECTIONS.reduce(
    (acc, sec) => {
      const list = menuData?.menu?.[sec.key] || [];
      const chosen = list.find((m) => Number(m.number) === Number(selected?.[sec.key]));
      if (!chosen) return acc;
      const scaled = scaleMacros(chosen, scale);
      return {
        kcal: acc.kcal + scaled.kcal,
        protein: acc.protein + scaled.protein,
        fat: acc.fat + scaled.fat,
        carbs: acc.carbs + scaled.carbs
      };
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const progressPct = Math.min(100, Math.round((totals.kcal / targetKcal) * 100));

  return (
    <div className="space-y-4 pb-24">
      {/* Верхняя Bento-карточка сводки дня */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-emerald-400">Рацион • {profile.name}</span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {totals.kcal} <span className="text-sm font-normal text-slate-400">/ {targetKcal} ккал</span>
            </h2>
          </div>
          <button
            onClick={onSyncMenu}
            disabled={isSyncing || isOffline}
            title="Обновить базу блюд из Google Таблицы"
            className="tap-spring p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-emerald-300 disabled:opacity-40 transition"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Прогресс-бар калорийности */}
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totals.kcal > targetKcal + 80 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* БЖУ в 3 компактных карточках */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
            <div className="text-[11px] text-slate-400">Белки</div>
            <div className="text-base font-bold text-white">{totals.protein} г</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
            <div className="text-[11px] text-slate-400">Жиры</div>
            <div className="text-base font-bold text-white">{totals.fat} г</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
            <div className="text-[11px] text-slate-400">Углеводы</div>
            <div className="text-base font-bold text-white">{totals.carbs} г</div>
          </div>
        </div>
      </div>

      {/* Переключатель: Обычный день / Разгрузочный день */}
      <div className="bg-slate-200/70 dark:bg-slate-900 p-1 rounded-2xl grid grid-cols-2 gap-1 border border-transparent dark:border-slate-800">
        <button
          onClick={() => setMode('regular')}
          className={`tap-spring py-2.5 rounded-xl text-xs font-bold transition ${
            mode === 'regular'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Конструктор дня
        </button>
        <button
          onClick={() => setMode('fasting')}
          className={`tap-spring py-2.5 rounded-xl text-xs font-bold transition ${
            mode === 'fasting'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Разгрузочный день
        </button>
      </div>

      {/* Памятка по взвешиванию готового блюда */}
      <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 rounded-2xl px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <span>Все граммовки пересчитаны под вашу норму и указаны для <b>готового блюда</b>.</span>
      </div>

      {mode === 'regular' ? (
        <div key="regular-mode" className="animate-tab-enter space-y-3">
          {MEAL_SECTIONS.map((sec) => {
            const dishes = menuData?.menu?.[sec.key] || [];
            const activeNum = Number(selected?.[sec.key]);
            const activeDish = dishes.find((d) => Number(d.number) === activeNum);
            const isOpen = openSection === sec.key;

            // Собираем блюда членов семьи, у которых включено подтягивание их выбора (useMemberMeals)
            // и выбран отличный от вашего вариант приёма пищи
            const familyOverrides = linkedMembers
              .filter((m) => m.useMemberMeals)
              .map((m) => {
                const mDishNum = Number(m.memberSelected?.[sec.key]);
                if (!mDishNum || mDishNum === activeNum) return null;
                const mDish = dishes.find((d) => Number(d.number) === mDishNum);
                if (!mDish) return null;
                const mMetrics = calculateProfileMetrics(m.profile);
                return {
                  memberId: m.id,
                  memberName: m.profile.name,
                  dish: mDish,
                  scale: mMetrics?.scale || 1,
                  macros: scaleMacros(mDish, mMetrics?.scale || 1)
                };
              })
              .filter(Boolean);

            return (
              <div
                key={sec.key}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : sec.key)}
                  className="tap-spring w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="pr-3 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full bg-linear-to-r ${sec.accent}`} />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{sec.label}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{sec.time}</span>
                      {familyOverrides.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-transparent dark:border-indigo-800/60 px-2 py-0.5 rounded-lg">
                          <Users className="w-3 h-3" /> +{familyOverrides.length} выбор семьи
                        </span>
                      )}
                    </div>

                    {activeDish ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">
                        {scaleTextWeights(activeDish.title, scale)}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">Нажмите, чтобы выбрать блюдо</p>
                    )}

                    {/* Подсвеченные плашки альтернативных блюд членов семьи в свёрнутой карточке */}
                    {familyOverrides.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        {familyOverrides.map((ov) => (
                          <div
                            key={ov.memberId}
                            className="bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl px-2.5 py-1.5 text-[11px] text-indigo-950 dark:text-indigo-200 flex items-center justify-between gap-2"
                          >
                            <span className="line-clamp-1">
                              <b className="text-indigo-700 dark:text-indigo-400">[{ov.memberName}]</b>{' '}
                              {scaleTextWeights(ov.dish.title, ov.scale)}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
                              {ov.macros.kcal} ккал
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeDish && (
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                        {scaleMacros(activeDish, scale).kcal} ккал
                      </span>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Плавное разворачивание и сворачивание списка блюд */}
                <div className={`accordion-grid ${isOpen ? 'is-open' : ''}`}>
                  <div className="accordion-inner">
                    <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2.5 space-y-2 bg-slate-50/60 dark:bg-slate-950/50 max-h-96 overflow-y-auto">
                      {/* Развёрнутые карточки блюд, выбранных членами семьи */}
                      {familyOverrides.map((ov) => (
                        <div
                          key={`open_${ov.memberId}`}
                          className="p-3 rounded-2xl bg-indigo-50/95 dark:bg-indigo-950/60 border border-indigo-300/80 dark:border-indigo-800/70 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg">
                              <Users className="w-3 h-3" /> [{ov.memberName}] — выбор участника
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMeal(sec.key, ov.dish.number);
                                setOpenSection(null);
                              }}
                              className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 underline"
                            >
                              Выбрать и себе
                            </button>
                          </div>
                          <div className="text-xs font-bold text-indigo-950 dark:text-indigo-100 leading-snug">
                            {scaleTextWeights(ov.dish.title, ov.scale)}
                          </div>
                          {ov.dish.composition && (
                            <div className="text-[11px] text-indigo-900/75 dark:text-indigo-300/80 leading-relaxed">
                              {scaleTextWeights(ov.dish.composition, ov.scale)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-indigo-800 dark:text-indigo-400 pt-0.5">
                            <span className="font-semibold">{ov.macros.kcal} ккал</span>
                            <span>• Б {ov.macros.protein}г</span>
                            <span>• Ж {ov.macros.fat}г</span>
                            <span>• У {ov.macros.carbs}г</span>
                          </div>
                        </div>
                      ))}

                      {/* Список всех блюд для вашего выбора */}
                      {dishes.map((dish) => {
                        const isSelected = Number(dish.number) === activeNum;
                        const m = scaleMacros(dish, scale);
                        const chosenByMembers = familyOverrides
                          .filter((ov) => Number(ov.dish.number) === Number(dish.number))
                          .map((ov) => ov.memberName);

                        return (
                          <button
                            key={dish.id}
                            onClick={() => {
                              onSelectMeal(sec.key, dish.number);
                              setOpenSection(null);
                            }}
                            className={`tap-spring w-full text-left p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 shadow-sm'
                                : chosenByMembers.length > 0
                                ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug flex items-center gap-1.5 flex-wrap">
                                <span>{scaleTextWeights(dish.title, scale)}</span>
                                {chosenByMembers.map((name) => (
                                  <span
                                    key={name}
                                    className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded-md"
                                  >
                                    [{name}]
                                  </span>
                                ))}
                              </div>
                              {dish.composition && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {scaleTextWeights(dish.composition, scale)}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{m.kcal} ккал</span>
                                <span>• Б {m.protein}г</span>
                                <span>• Ж {m.fat}г</span>
                                <span>• У {m.carbs}г</span>
                              </div>
                            </div>
                            <CheckCircle2
                              className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                                isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div key="fasting-mode" className="animate-tab-enter space-y-3">
          {(menuData?.menu?.fastDays || []).map((fd) => {
            const m = scaleMacros(fd, scale);
            return (
              <div
                key={fd.id}
                className="tap-spring bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5" /> Вариант №{fd.number}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> {m.kcal} ккал
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {scaleTextWeights(fd.title, scale)}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Б: {m.protein} г • Ж: {m.fat} г • У: {m.carbs} г
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}