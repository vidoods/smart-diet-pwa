import React, { useMemo } from 'react';
import { ShoppingBag, Users, Check, RotateCcw, CalendarDays } from 'lucide-react';
import { buildGroceryList } from '../utils/dietEngine';

export default function GroceryView({
  allIngredients,
  myParticipant,
  familyMembers,
  activeMemberIds,
  onToggleMember,
  days,
  onChangeDays,
  checkedItems,
  onToggleItem,
  onClearChecked
}) {
  // Собираем список участников для расчета корзины (я + выбранные члены семьи)
  const participants = useMemo(() => {
    const list = [myParticipant];
    familyMembers.forEach((member) => {
      if (activeMemberIds.includes(member.id)) {
        list.push(member);
      }
    });
    return list;
  }, [myParticipant, familyMembers, activeMemberIds]);

  const items = useMemo(
    () => buildGroceryList(allIngredients || [], participants, days),
    [allIngredients, participants, days]
  );

  // Группировка по категориям (отделам магазина)
  const grouped = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups);
  }, [items]);

  const boughtCount = items.filter((i) => checkedItems?.[i.key]).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Панель настройки корзины */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Список покупок</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Куплено {boughtCount} из {items.length} позиций
              </p>
            </div>
          </div>
          {boughtCount > 0 && (
            <button
              onClick={onClearChecked}
              className="tap-spring inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Сбросить
            </button>
          )}
        </div>

        {/* Выбор количества дней */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> На сколько дней закупаем:
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                onClick={() => onChangeDays(d)}
                className={`tap-spring py-2 rounded-xl text-xs font-bold transition ${
                  days === d
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {d}д
              </button>
            ))}
          </div>
        </div>

        {/* Выбор участников (Я + члены семьи) */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Для кого считать порции:
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white">
              <Check className="w-3.5 h-3.5" /> {myParticipant.profile.name} (Я)
            </span>

            {familyMembers.map((member) => {
              const isOn = activeMemberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => onToggleMember(member.id)}
                  className={`tap-spring inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    isOn
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isOn && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  {member.profile.name}
                  <span className="text-[10px] opacity-70">
                    ({member.type === 'linked' && member.useMemberMeals ? 'свое меню' : 'общ. меню'})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Список продуктов по отделам */}
      {grouped.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 transition-colors">
          Выберите блюда во вкладке «Меню», чтобы сформировать список продуктов.
        </div>
      ) : (
        grouped.map(([category, categoryItems]) => (
          <div key={category} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {category}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categoryItems.map((item) => {
                const isBought = Boolean(checkedItems?.[item.key]);
                return (
                  <button
                    key={item.key}
                    onClick={() => onToggleItem(item.key)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3 pr-3">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                          isBought
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isBought && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-sm font-medium transition ${
                          isBought ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.product}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 px-2.5 py-1 rounded-xl transition ${
                        isBought
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {item.amount} {item.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}