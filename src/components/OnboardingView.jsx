import React, { useState } from 'react';
import { UserCheck, Scale, Ruler, Calendar, Activity, Target, Sparkles } from 'lucide-react';
import { EMPTY_PROFILE_FORM, calculateProfileMetrics } from '../utils/dietEngine';

export default function OnboardingView({ userEmail, onSave }) {
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [error, setError] = useState('');

  const previewMetrics = calculateProfileMetrics(form);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.height || !form.weight) {
      setError('Пожалуйста, заполните имя, возраст, рост и текущий вес для точного расчета порций.');
      return;
    }
    if (form.age < 10 || form.age > 110 || form.height < 100 || form.height > 230 || form.weight < 30 || form.weight > 250) {
      setError('Проверьте корректность введенных параметров (возраст, рост в см, вес в кг).');
      return;
    }
    setError('');
    onSave({
      ...form,
      name: form.name.trim(),
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight)
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900 text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Настройка профиля</h1>
            <p className="text-xs text-slate-300">{userEmail}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Укажите ваши параметры — система автоматически рассчитает индивидуальную калорийность и вес каждой порции.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Ваше имя</label>
            <input
              type="text"
              placeholder="Например: Виталий или Оксана"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'male', label: 'Мужчина' },
              { id: 'female', label: 'Женщина' }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setForm({ ...form, gender: g.id })}
                className={`py-3 rounded-2xl text-sm font-semibold border transition ${
                  form.gender === g.id
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Возраст
              </div>
              <input
                type="number"
                placeholder="лет"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Рост (см)
              </div>
              <input
                type="number"
                placeholder="см"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Вес (кг)
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="кг"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Физическая активность
            </label>
            <select
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              className="w-full bg-slate-800/90 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="sedentary">Минимальная (сидячий образ жизни)</option>
              <option value="light">Слабая (пешие прогулки)</option>
              <option value="moderate">Умеренная (тренировки 3 раза/нед)</option>
              <option value="high">Высокая (физический труд / спорт)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Ваша цель
            </label>
            <select
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="w-full bg-slate-800/90 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="loss">Снижение веса</option>
              <option value="maintain">Поддержание веса (стабилизация)</option>
              <option value="gain">Набор массы</option>
            </select>
          </div>

          {previewMetrics && (
            <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">Ваша норма</div>
                <div className="text-xl font-extrabold text-white">{previewMetrics.targetKcal} ккал/день</div>
              </div>
              <div className="text-right text-xs text-slate-300">
                <div>ИМТ: <span className="font-semibold text-white">{previewMetrics.bmi}</span></div>
                <div>Расход: <span className="font-semibold text-white">{previewMetrics.tdee} ккал</span></div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.99]"
          >
            <UserCheck className="w-5 h-5" /> Сохранить и открыть меню
          </button>
        </form>
      </div>
    </div>
  );
}