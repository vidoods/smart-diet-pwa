import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Flame, Sparkles, ChevronDown, Info } from 'lucide-react';
import { calculateProfileMetrics, scaleTextWeights, scaleMacros } from '../utils/dietEngine';

const MEAL_SECTIONS = [
  { key: 'breakfast', label: 'Завтрак', time: '06:00 – 09:00', accent: 'from-amber-500 to-orange-500' },
  { key: 'secondBreakfast', label: 'Второй завтрак', time: '09:00 – 11:00', accent: 'from-emerald-500 to-teal-500' },
  { key: 'lunch', label: 'Обед', time: '12:00 – 14:00', accent: 'from-sky-500 to-indigo-500' },
  { key: 'dinner', label: 'Ужин', time: '17:00 – 20:00', accent: 'from-violet-500 to-purple-600' }
];

export default function MenuView({ profile, menuData, selected, onSelectMeal, onSyncMenu, isSyncing, isOffline }) {
  const [mode, setMode] = useState('regular'); // 'regular' | 'fasting'
  const [openSection, setOpenSection] = useState('breakfast');

  const metrics = calculateProfileMetrics(profile);
  if (!metrics) return null;

  const { targetKcal, scale } = metrics;

  // Суммируем КБЖУ выбранного рациона на день
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
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-emerald-300 disabled:opacity-40 transition"
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
      <div className="bg-slate-200/70 p-1 rounded-2xl grid grid-cols-2 gap-1">
        <button
          onClick={() => setMode('regular')}
          className={`py-2.5 rounded-xl text-xs font-bold transition ${
            mode === 'regular' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Конструктор дня
        </button>
        <button
          onClick={() => setMode('fasting')}
          className={`py-2.5 rounded-xl text-xs font-bold transition ${
            mode === 'fasting' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Разгрузочный день
        </button>
      </div>

      {/* Памятка по взвешиванию готового блюда */}
      <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl px-3.5 py-2.5 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>Все граммовки пересчитаны под вашу норму и указаны для <b>готового блюда</b>.</span>
      </div>

      {mode === 'regular' ? (
        <div className="space-y-3">
          {MEAL_SECTIONS.map((sec) => {
            const dishes = menuData?.menu?.[sec.key] || [];
            const activeNum = Number(selected?.[sec.key]);
            const activeDish = dishes.find((d) => Number(d.number) === activeNum);
            const isOpen = openSection === sec.key;

            return (
              <div
                key={sec.key}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenSection(isOpen ? null : sec.key)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full bg-linear-to-r ${sec.accent}`} />
                      <span className="font-bold text-slate-900 text-sm">{sec.label}</span>
                      <span className="text-[11px] text-slate-400">{sec.time}</span>
                    </div>
                    {activeDish ? (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-medium">
                        {scaleTextWeights(activeDish.title, scale)}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">Нажмите, чтобы выбрать блюдо</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeDish && (
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                        {scaleMacros(activeDish, scale).kcal} ккал
                      </span>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-3 py-2.5 space-y-2 bg-slate-50/60 max-h-96 overflow-y-auto">
                    {dishes.map((dish) => {
                      const isSelected = Number(dish.number) === activeNum;
                      const m = scaleMacros(dish, scale);
                      return (
                        <button
                          key={dish.id}
                          onClick={() => {
                            onSelectMeal(sec.key, dish.number);
                            setOpenSection(null);
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                              : 'bg-white border-slate-200/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900 leading-snug">
                              {scaleTextWeights(dish.title, scale)}
                            </div>
                            {dish.composition && (
                              <div className="text-[11px] text-slate-500 leading-relaxed">
                                {scaleTextWeights(dish.composition, scale)}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                              <span className="font-semibold text-emerald-700">{m.kcal} ккал</span>
                              <span>• Б {m.protein}г</span>
                              <span>• Ж {m.fat}г</span>
                              <span>• У {m.carbs}г</span>
                            </div>
                          </div>
                          <CheckCircle2
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              isSelected ? 'text-emerald-600' : 'text-slate-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {(menuData?.menu?.fastDays || []).map((fd) => {
            const m = scaleMacros(fd, scale);
            return (
              <div
                key={fd.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5" /> Вариант №{fd.number}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-800">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> {m.kcal} ккал
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {scaleTextWeights(fd.title, scale)}
                </p>
                <div className="text-[11px] text-slate-500">
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