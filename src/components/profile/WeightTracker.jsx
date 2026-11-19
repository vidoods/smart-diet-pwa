import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Scale
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WeightTracker({
  weightHistory = [],
  currentWeight,
  targetGoalWeight,
  height,
  onAddEntry,
  onDeleteEntry
}) {
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [newWeight, setNewWeight] = useState(currentWeight ? String(currentWeight) : '');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState('');
  const [selectedRange, setSelectedRange] = useState('all'); // '7d' | '30d' | '90d' | 'all'
  const [activePoint, setActivePoint] = useState(null);

  // Сортировка записей по дате (по возрастанию для графика)
  const sortedHistory = useMemo(() => {
    const list = [...weightHistory];
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  }, [weightHistory]);

  // Фильтрация по выбранному диапазону
  const filteredHistory = useMemo(() => {
    if (selectedRange === 'all') return sortedHistory;
    const now = new Date();
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sortedHistory.filter((item) => new Date(item.date) >= cutoff);
  }, [sortedHistory, selectedRange]);

  // Аналитические расчеты (прогресс, дельта, ИМТ)
  const stats = useMemo(() => {
    if (sortedHistory.length === 0) return null;
    const first = sortedHistory[0];
    const latest = sortedHistory[sortedHistory.length - 1];
    const totalDelta = Number((latest.weight - first.weight).toFixed(1));

    // Дельта за выбранный диапазон
    let rangeDelta = 0;
    if (filteredHistory.length > 1) {
      const rangeFirst = filteredHistory[0];
      const rangeLatest = filteredHistory[filteredHistory.length - 1];
      rangeDelta = Number((rangeLatest.weight - rangeFirst.weight).toFixed(1));
    }

    const currentBmi = height
      ? Number((latest.weight / Math.pow(height / 100, 2)).toFixed(1))
      : null;

    return {
      latestWeight: latest.weight,
      totalDelta,
      rangeDelta,
      currentBmi,
      entriesCount: sortedHistory.length
    };
  }, [sortedHistory, filteredHistory, height]);

  // Геометрия SVG-графика
  const chartData = useMemo(() => {
    if (filteredHistory.length < 2) return null;

    const weights = filteredHistory.map((d) => Number(d.weight));
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    // Делаем отступы сверху и снизу
    const paddingVal = Math.max(0.6, (maxW - minW) * 0.15);
    const yMin = Math.floor((minW - paddingVal) * 10) / 10;
    const yMax = Math.ceil((maxW + paddingVal) * 10) / 10;
    const yRange = yMax - yMin || 1;

    const width = 340;
    const height = 150;
    const padX = 25;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padX * 2;
    const plotH = height - padTop - padBottom;

    const points = filteredHistory.map((d, i) => {
      const x = padX + (i / (filteredHistory.length - 1)) * plotW;
      const y = padTop + plotH - ((Number(d.weight) - yMin) / yRange) * plotH;
      return {
        x,
        y,
        weight: d.weight,
        date: d.date,
        note: d.note,
        id: d.id
      };
    });

    // Построение плавной SVG-кривой
    const pathD = points.reduce((acc, p, i, arr) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, '');

    // Градиентная область под кривой
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const bottomY = (height - padBottom).toFixed(1);
    const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return {
      points,
      pathD,
      areaD,
      width,
      height,
      yMin,
      yMax,
      padX,
      padTop,
      padBottom,
      plotH
    };
  }, [filteredHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (!val || val < 20 || val > 300) return;

    onAddEntry({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      weight: Number(val.toFixed(1)),
      date: newDate,
      note: newNote.trim()
    });

    setNewWeight('');
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      {/* Заголовок и кнопка добавить */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {t('weight.title')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('weight.subtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isAdding && currentWeight && !newWeight) {
              setNewWeight(String(currentWeight));
            }
            setIsAdding(!isAdding);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/50 px-3 py-1.5 rounded-xl transition"
        >
          {isAdding ? t('common.cancel') : (
            <>
              <Plus className="w-3.5 h-3.5" /> {t('weight.addRecord')}
            </>
          )}
        </button>
      </div>

      {/* Быстрая форма ввода нового веса */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
            {t('weight.recordWeight')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                {t('weight.weightKg')}
              </label>
              <input
                type="number"
                step="0.1"
                required
                autoFocus
                placeholder="75.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                {t('weight.date')}
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
              {t('weight.note')}
            </label>
            <input
              type="text"
              placeholder={t('weight.notePlaceholder')}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      )}

      {/* Карточки ключевых показателей */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 text-center border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('weight.current')}
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats.latestWeight} <span className="text-[11px] font-normal text-slate-500">{t('common.kg')}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 text-center border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('weight.dynamics')}
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              {stats.totalDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.totalDelta}
                  </span>
                </>
              ) : stats.totalDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-base font-extrabold text-amber-500">
                    +{stats.totalDelta}
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-base font-extrabold text-slate-600 dark:text-slate-300">
                    0.0
                  </span>
                </>
              )}
              <span className="text-[11px] font-normal text-slate-500">{t('common.kg')}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 text-center border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('weight.bmi')}
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats.currentBmi || '—'}
            </div>
          </div>
        </div>
      )}

      {/* График веса */}
      {chartData ? (
        <div className="space-y-2 pt-1">
          {/* Фильтры по времени */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t('weight.period')}
            </span>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px]">
              {[
                { id: '7d', label: t('weight.range7d') },
                { id: '30d', label: t('weight.range30d') },
                { id: '90d', label: t('weight.range90d') },
                { id: 'all', label: t('weight.rangeAll') }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedRange(btn.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    selectedRange === btn.id
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl p-2 border border-slate-100 dark:border-slate-800/70">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Горизонтальные направляющие линии */}
              <line
                x1={chartData.padX}
                y1={chartData.padTop}
                x2={chartData.width - chartData.padX}
                y2={chartData.padTop}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={chartData.padX}
                y1={chartData.padTop + chartData.plotH / 2}
                x2={chartData.width - chartData.padX}
                y2={chartData.padTop + chartData.plotH / 2}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={chartData.padX}
                y1={chartData.padTop + chartData.plotH}
                x2={chartData.width - chartData.padX}
                y2={chartData.padTop + chartData.plotH}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />

              {/* Подписи оси Y */}
              <text
                x={chartData.padX - 4}
                y={chartData.padTop + 3}
                textAnchor="end"
                className="fill-slate-400 text-[9px] font-mono"
              >
                {chartData.yMax}
              </text>
              <text
                x={chartData.padX - 4}
                y={chartData.padTop + chartData.plotH}
                textAnchor="end"
                className="fill-slate-400 text-[9px] font-mono"
              >
                {chartData.yMin}
              </text>

              {/* Заливка под графиком */}
              <path d={chartData.areaD} fill="url(#weightAreaGrad)" />

              {/* Линия тренда */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Точки на графике */}
              {chartData.points.map((pt, idx) => {
                const isSelected = activePoint?.id === pt.id;
                return (
                  <g key={pt.id || idx} className="cursor-pointer" onClick={() => setActivePoint(pt)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      className="fill-emerald-500 stroke-white dark:stroke-slate-900 transition-all"
                      strokeWidth="2"
                    />
                    {/* Дата под первой и последней точками */}
                    {(idx === 0 || idx === chartData.points.length - 1) && (
                      <text
                        x={pt.x}
                        y={chartData.height - 8}
                        textAnchor={idx === 0 ? 'start' : 'end'}
                        className="fill-slate-400 text-[9px]"
                      >
                        {new Date(pt.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Всплывающая подсказка при тапе на точку */}
            {activePoint && (
              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {activePoint.weight} кг
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    {new Date(activePoint.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  {activePoint.note && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 italic">
                      "{activePoint.note}"
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActivePoint(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      ) : sortedHistory.length === 1 ? (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t('weight.oneRecordHint')}
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('weight.emptyHint')}
          </p>
          <button
            type="button"
            onClick={() => {
              if (currentWeight && !newWeight) setNewWeight(String(currentWeight));
              setIsAdding(true);
            }}
            className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {t('weight.firstRecordBtn')}
          </button>
        </div>
      )}

      {/* Аккордеон журнала записей */}
      {sortedHistory.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full flex items-center justify-between py-1.5 px-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group select-none"
          >
            <div className="flex items-center gap-2">
              <span>{t('weight.historyTitle')}</span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                {sortedHistory.length}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-normal text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
              <span>{isHistoryOpen ? t('common.collapse') : t('common.expand')}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isHistoryOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {isHistoryOpen && (
            <div className="mt-2 max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 animate-accordion">
              {[...sortedHistory].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="pt-1.5 flex items-center justify-between text-xs group/item"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      {entry.weight} {t('common.kg')}
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0">
                      {new Date(entry.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'uk' ? 'uk-UA' : 'ru-RU', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    {entry.note && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        {entry.note}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    title="Удалить запись"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="opacity-40 group-hover/item:opacity-100 hover:text-rose-500 text-slate-400 p-1 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
