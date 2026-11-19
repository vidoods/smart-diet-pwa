import React, { useState } from 'react';
import { User, Save } from 'lucide-react';
import { calculateProfileMetrics } from '../../utils/dietEngine';

export default function UserProfileForm({ profile, onSaveProfile }) {
  const [editProfile, setEditProfile] = useState(profile);
  const [savedNotice, setSavedNotice] = useState(false);

  const metrics = calculateProfileMetrics(editProfile);

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!editProfile.name?.trim() || !editProfile.age || !editProfile.height || !editProfile.weight) return;
    const nextWeight = Number(editProfile.weight);
    const prevWeight = Number(profile.weight);

    onSaveProfile(
      {
        ...editProfile,
        name: editProfile.name.trim(),
        age: Number(editProfile.age),
        height: Number(editProfile.height),
        weight: nextWeight
      },
      nextWeight !== prevWeight ? nextWeight : null
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleProfileSave} className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Мои параметры
        </h3>
        {metrics && (
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
            Норма: {metrics.targetKcal} ккал • ИМТ {metrics.bmi}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Имя</label>
          <input
            type="text"
            value={editProfile.name}
            onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Пол</label>
          <select
            value={editProfile.gender}
            onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 dark:text-white"
          >
            <option value="male">Мужчина</option>
            <option value="female">Женщина</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Возраст</label>
          <input
            type="number"
            value={editProfile.age}
            onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Рост (см)</label>
          <input
            type="number"
            value={editProfile.height}
            onChange={(e) => setEditProfile({ ...editProfile, height: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Вес (кг)</label>
          <input
            type="number"
            step="0.1"
            value={editProfile.weight}
            onChange={(e) => setEditProfile({ ...editProfile, weight: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Активность</label>
          <select
            value={editProfile.activity}
            onChange={(e) => setEditProfile({ ...editProfile, activity: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="sedentary">Минимальная (сидячий)</option>
            <option value="light">Слабая (пешие прогулки)</option>
            <option value="moderate">Умеренная (тренировки 3р/нед)</option>
            <option value="high">Высокая (спорт / физ. труд)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Цель</label>
          <select
            value={editProfile.goal}
            onChange={(e) => setEditProfile({ ...editProfile, goal: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="loss">Снижение веса</option>
            <option value="maintain">Поддержание веса</option>
            <option value="gain">Набор массы</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="tap-spring w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
      >
        <Save className="w-4 h-4 text-emerald-400 dark:text-white" />
        {savedNotice ? 'Параметры обновлены!' : 'Сохранить изменения'}
      </button>
    </form>
  );
}
