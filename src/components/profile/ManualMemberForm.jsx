import React, { useState } from 'react';
import { EMPTY_PROFILE_FORM } from '../../utils/dietEngine';

export default function ManualMemberForm({ onAddMember, onCancel }) {
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.height || !form.weight) {
      setError('Заполните имя, возраст, рост и вес члена семьи.');
      return;
    }
    onAddMember({
      id: `manual_${Date.now()}`,
      type: 'manual',
      profile: {
        ...form,
        name: form.name.trim(),
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight)
      }
    });
    setForm(EMPTY_PROFILE_FORM);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-3 transition-colors">
      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Новый профиль (без регистрации)</div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Имя члена семьи"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
        />
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
        >
          <option value="female">Женщина</option>
          <option value="male">Мужчина</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          placeholder="Возраст"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
        />
        <input
          type="number"
          placeholder="Рост (см)"
          value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
        />
        <input
          type="number"
          step="0.1"
          placeholder="Вес (кг)"
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.activity}
          onChange={(e) => setForm({ ...form, activity: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
        >
          <option value="sedentary">Сидячий образ</option>
          <option value="light">Пешие прогулки</option>
          <option value="moderate">Тренировки 3р/нед</option>
          <option value="high">Высокая активность</option>
        </select>
        <select
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
        >
          <option value="loss">Снижение веса</option>
          <option value="maintain">Поддержание веса</option>
          <option value="gain">Набор массы</option>
        </select>
      </div>
      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="tap-spring flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
        >
          Сохранить в семью
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap-spring px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
